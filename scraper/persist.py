import datetime

from sqlmodel import select

from shared.models import Asignatura, AsignaturaPlan, Facultad, Grupo, GrupoHorario, PlanEstudios


def split_codigo_nombre(text):
    """SIA option/row labels look like '3068 FACULTAD DE MINAS' -- split off
    the leading code."""
    codigo, _, nombre = text.strip().partition(" ")
    return codigo, nombre.strip()


def upsert_facultad(session, option_text, sede):
    codigo, nombre = split_codigo_nombre(option_text)
    facultad = session.exec(
        select(Facultad).where(Facultad.codigo == codigo, Facultad.sede == sede)
    ).first()
    if facultad is None:
        facultad = Facultad(codigo=codigo, nombre=nombre, sede=sede)
        session.add(facultad)
        session.flush()
    return facultad


def upsert_plan(session, option_text, nivel, facultad_id):
    codigo, nombre = split_codigo_nombre(option_text)
    plan = session.exec(
        select(PlanEstudios).where(PlanEstudios.codigo == codigo, PlanEstudios.facultad_id == facultad_id)
    ).first()
    if plan is None:
        plan = PlanEstudios(codigo=codigo, nombre=nombre, nivel=nivel, facultad_id=facultad_id)
        session.add(plan)
        session.flush()
    return plan


def upsert_asignatura(session, row, sede):
    codigo = row["codigo"].strip()
    asignatura = session.exec(
        select(Asignatura).where(Asignatura.codigo == codigo, Asignatura.sede == sede)
    ).first()
    creditos = int(row["creditos"]) if row["creditos"].isdigit() else None
    if asignatura is None:
        asignatura = Asignatura(
            codigo=codigo,
            sede=sede,
            nombre=row["nombre"],
            creditos=creditos,
            tipologia=row["tipologia"],
            descripcion=row["descripcion"],
        )
        session.add(asignatura)
        session.flush()
    else:
        asignatura.nombre = row["nombre"]
        asignatura.creditos = creditos
        asignatura.tipologia = row["tipologia"]
        asignatura.descripcion = row["descripcion"]
    return asignatura


def link_asignatura_plan(session, asignatura_id, plan_estudios_id):
    exists = session.exec(
        select(AsignaturaPlan).where(
            AsignaturaPlan.asignatura_id == asignatura_id,
            AsignaturaPlan.plan_estudios_id == plan_estudios_id,
        )
    ).first()
    if exists is None:
        session.add(AsignaturaPlan(asignatura_id=asignatura_id, plan_estudios_id=plan_estudios_id))


def _parse_fecha(value):
    if not value:
        return None
    return datetime.datetime.strptime(value, "%d/%m/%Y").date()


def _parse_hora(value):
    return datetime.datetime.strptime(value, "%H:%M").time()


def replace_grupos(session, asignatura_id, grupos):
    """Groups reflect the currently-open offering, so a fresh scrape
    replaces whatever was previously stored for this asignatura."""
    old_grupos = session.exec(select(Grupo).where(Grupo.asignatura_id == asignatura_id)).all()
    old_ids = [g.id for g in old_grupos]
    if old_ids:
        # No Relationship()/cascade is declared between Grupo and
        # GrupoHorario, so SQLAlchemy has no way to know it must delete
        # horarios before their parent grupo -- do it as two explicit
        # phases instead of relying on unit-of-work ordering.
        for h in session.exec(select(GrupoHorario).where(GrupoHorario.grupo_id.in_(old_ids))).all():
            session.delete(h)
        session.flush()
        for g in old_grupos:
            session.delete(g)
        session.flush()

    scraped_at = datetime.datetime.now(datetime.timezone.utc)
    for g in grupos:
        grupo = Grupo(
            asignatura_id=asignatura_id,
            numero=g["numero"],
            profesor=g["profesor"],
            jornada=g["jornada"],
            cupos_disponibles=g["cupos_disponibles"],
            fecha_inicio=_parse_fecha(g["fecha_inicio"]),
            fecha_fin=_parse_fecha(g["fecha_fin"]),
            scraped_at=scraped_at,
        )
        session.add(grupo)
        session.flush()
        for h in g["horarios"]:
            session.add(
                GrupoHorario(
                    grupo_id=grupo.id,
                    dia=h["dia"],
                    hora_inicio=_parse_hora(h["hora_inicio"]),
                    hora_fin=_parse_hora(h["hora_fin"]),
                )
            )

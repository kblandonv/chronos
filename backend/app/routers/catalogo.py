from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.db import get_session
from app.schemas import AsignaturaDetailRead, AsignaturaRead, FacultadRead, GrupoRead, HorarioRead, PlanRead
from shared.models import Asignatura, AsignaturaPlan, Facultad, Grupo, GrupoHorario, PlanEstudios

router = APIRouter(prefix="/catalogo", tags=["catalogo"])


def _grupo_read(session: Session, grupo: Grupo, asignatura: Asignatura) -> GrupoRead:
    horarios = session.exec(select(GrupoHorario).where(GrupoHorario.grupo_id == grupo.id)).all()
    return GrupoRead(
        **grupo.model_dump(),
        asignatura_codigo=asignatura.codigo,
        asignatura_nombre=asignatura.nombre,
        horarios=[HorarioRead(**h.model_dump()) for h in horarios],
    )


@router.get("/niveles")
def list_niveles() -> list[str]:
    return ["pregrado", "doctorado", "postgrado"]


@router.get("/facultades", response_model=list[FacultadRead])
def list_facultades(nivel: Optional[str] = None, session: Session = Depends(get_session)):
    query = select(Facultad)
    if nivel:
        query = (
            select(Facultad)
            .join(PlanEstudios, PlanEstudios.facultad_id == Facultad.id)
            .where(PlanEstudios.nivel == nivel)
            .distinct()
        )
    return session.exec(query).all()


@router.get("/facultades/{facultad_id}/planes", response_model=list[PlanRead])
def list_planes(facultad_id: int, session: Session = Depends(get_session)):
    return session.exec(select(PlanEstudios).where(PlanEstudios.facultad_id == facultad_id)).all()


@router.get("/planes/{plan_id}/tipologias", response_model=list[str])
def list_tipologias(plan_id: int, session: Session = Depends(get_session)):
    query = (
        select(Asignatura.tipologia)
        .join(AsignaturaPlan, AsignaturaPlan.asignatura_id == Asignatura.id)
        .where(AsignaturaPlan.plan_estudios_id == plan_id)
        .distinct()
    )
    return sorted(t for t in session.exec(query).all() if t)


@router.get("/planes/{plan_id}/asignaturas", response_model=list[AsignaturaRead])
def list_asignaturas(plan_id: int, tipologia: Optional[str] = None, session: Session = Depends(get_session)):
    query = (
        select(Asignatura)
        .join(AsignaturaPlan, AsignaturaPlan.asignatura_id == Asignatura.id)
        .where(AsignaturaPlan.plan_estudios_id == plan_id)
    )
    if tipologia:
        query = query.where(Asignatura.tipologia == tipologia)
    return session.exec(query).all()


@router.get("/asignaturas", response_model=list[AsignaturaRead])
def search_asignaturas(q: str = Query(..., min_length=2), session: Session = Depends(get_session)):
    return session.exec(select(Asignatura).where(Asignatura.nombre.ilike(f"%{q}%"))).all()


@router.get("/asignaturas/{asignatura_id}", response_model=AsignaturaDetailRead)
def get_asignatura(asignatura_id: int, session: Session = Depends(get_session)):
    asignatura = session.get(Asignatura, asignatura_id)
    if asignatura is None:
        raise HTTPException(status_code=404, detail="asignatura not found")

    grupos = session.exec(select(Grupo).where(Grupo.asignatura_id == asignatura_id)).all()
    return AsignaturaDetailRead(
        **asignatura.model_dump(),
        grupos=[_grupo_read(session, g, asignatura) for g in grupos],
    )

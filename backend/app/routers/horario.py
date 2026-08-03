import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import get_current_user
from app.db import get_session
from app.schemas import GrupoRead, HorarioRead, UsuarioRead
from shared.models import Grupo, GrupoHorario, Usuario, UsuarioGrupo

router = APIRouter(prefix="/me", tags=["horario"])


def _grupo_read(session: Session, grupo: Grupo) -> GrupoRead:
    horarios = session.exec(select(GrupoHorario).where(GrupoHorario.grupo_id == grupo.id)).all()
    return GrupoRead(**grupo.model_dump(), horarios=[HorarioRead(**h.model_dump()) for h in horarios])


def _grupos_del_usuario(session: Session, usuario_id: int) -> list[Grupo]:
    return session.exec(
        select(Grupo)
        .join(UsuarioGrupo, UsuarioGrupo.grupo_id == Grupo.id)
        .where(UsuarioGrupo.usuario_id == usuario_id)
    ).all()


def _grupos_en_conflicto(session: Session, usuario_id: int, nuevo_grupo_id: int) -> list[Grupo]:
    nuevos_horarios = session.exec(select(GrupoHorario).where(GrupoHorario.grupo_id == nuevo_grupo_id)).all()

    conflictos = []
    for grupo in _grupos_del_usuario(session, usuario_id):
        horarios = session.exec(select(GrupoHorario).where(GrupoHorario.grupo_id == grupo.id)).all()
        se_cruzan = any(
            h1.dia == h2.dia and h1.hora_inicio < h2.hora_fin and h2.hora_inicio < h1.hora_fin
            for h1 in nuevos_horarios
            for h2 in horarios
        )
        if se_cruzan:
            conflictos.append(grupo)
    return conflictos


@router.get("", response_model=UsuarioRead)
def me(usuario: Usuario = Depends(get_current_user)):
    return usuario


@router.get("/horario", response_model=list[GrupoRead])
def get_horario(usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    return [_grupo_read(session, g) for g in _grupos_del_usuario(session, usuario.id)]


@router.post("/horario/{grupo_id}", response_model=GrupoRead, status_code=201)
def add_grupo(
    grupo_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    grupo = session.get(Grupo, grupo_id)
    if grupo is None:
        raise HTTPException(status_code=404, detail="grupo not found")

    if session.get(UsuarioGrupo, (usuario.id, grupo_id)) is not None:
        return _grupo_read(session, grupo)

    conflictos = _grupos_en_conflicto(session, usuario.id, grupo_id)
    if conflictos:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "el horario de este grupo cruza con otro que ya tienes en tu horario",
                "grupos_en_conflicto": [g.id for g in conflictos],
            },
        )

    session.add(
        UsuarioGrupo(
            usuario_id=usuario.id,
            grupo_id=grupo_id,
            added_at=datetime.datetime.now(datetime.timezone.utc),
        )
    )
    session.commit()
    return _grupo_read(session, grupo)


@router.delete("/horario/{grupo_id}", status_code=204)
def remove_grupo(
    grupo_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.get(UsuarioGrupo, (usuario.id, grupo_id))
    if existing is not None:
        session.delete(existing)
        session.commit()

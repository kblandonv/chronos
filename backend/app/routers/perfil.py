import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import get_current_user
from app.db import get_session
from app.schemas import PlanRead
from shared.models import PlanEstudios, Usuario, UsuarioPlan

router = APIRouter(prefix="/me/planes", tags=["perfil"])


@router.get("", response_model=list[PlanRead])
def get_planes(usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(
        select(PlanEstudios)
        .join(UsuarioPlan, UsuarioPlan.plan_estudios_id == PlanEstudios.id)
        .where(UsuarioPlan.usuario_id == usuario.id)
    ).all()


@router.post("/{plan_id}", response_model=PlanRead, status_code=201)
def add_plan(
    plan_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    plan = session.get(PlanEstudios, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="plan not found")

    if session.get(UsuarioPlan, (usuario.id, plan_id)) is None:
        session.add(
            UsuarioPlan(
                usuario_id=usuario.id,
                plan_estudios_id=plan_id,
                added_at=datetime.datetime.now(datetime.timezone.utc),
            )
        )
        session.commit()
    return plan


@router.delete("/{plan_id}", status_code=204)
def remove_plan(
    plan_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.get(UsuarioPlan, (usuario.id, plan_id))
    if existing is not None:
        session.delete(existing)
        session.commit()

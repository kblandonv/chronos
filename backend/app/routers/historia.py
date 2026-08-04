import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.auth import get_current_user
from app.db import get_session
from app.historia_parser import parse_historia
from app.schemas import HistoriaAcademicaInput, HistoriaAcademicaRead
from shared.models import HistoriaAcademica, Usuario

router = APIRouter(tags=["historia"])


@router.post("/historia/parse", response_model=HistoriaAcademicaRead)
def parse(body: HistoriaAcademicaInput):
    """Public: parses a Historia Academica paste without storing anything.
    Used for anonymous users, whose result gets kept in localStorage."""
    return parse_historia(body.text)


@router.get("/me/historia", response_model=HistoriaAcademicaRead)
def get_historia(usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    historia = session.get(HistoriaAcademica, usuario.id)
    if historia is None:
        raise HTTPException(status_code=404, detail="no hay historia academica guardada todavia")
    return historia


@router.put("/me/historia", response_model=HistoriaAcademicaRead)
def put_historia(
    body: HistoriaAcademicaInput,
    usuario: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    parsed = parse_historia(body.text)
    historia = session.get(HistoriaAcademica, usuario.id)
    if historia is None:
        historia = HistoriaAcademica(usuario_id=usuario.id, **parsed, actualizado_at=datetime.datetime.now(datetime.timezone.utc))
        session.add(historia)
    else:
        for key, value in parsed.items():
            setattr(historia, key, value)
        historia.actualizado_at = datetime.datetime.now(datetime.timezone.utc)
    session.commit()
    session.refresh(historia)
    return historia

import datetime
from typing import Optional

from sqlmodel import SQLModel


class HorarioRead(SQLModel):
    dia: str
    hora_inicio: datetime.time
    hora_fin: datetime.time


class GrupoRead(SQLModel):
    id: int
    asignatura_id: int
    numero: int
    profesor: Optional[str] = None
    jornada: Optional[str] = None
    cupos_disponibles: Optional[int] = None
    fecha_inicio: Optional[datetime.date] = None
    fecha_fin: Optional[datetime.date] = None
    horarios: list[HorarioRead] = []


class AsignaturaRead(SQLModel):
    id: int
    codigo: str
    nombre: str
    creditos: Optional[int] = None
    tipologia: Optional[str] = None
    descripcion: Optional[str] = None


class AsignaturaDetailRead(AsignaturaRead):
    grupos: list[GrupoRead] = []


class FacultadRead(SQLModel):
    id: int
    codigo: str
    nombre: str


class PlanRead(SQLModel):
    id: int
    codigo: str
    nombre: str
    nivel: str
    facultad_id: int


class UsuarioRead(SQLModel):
    id: int
    email: str
    nombre: Optional[str] = None

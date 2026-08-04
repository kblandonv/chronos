import datetime
from typing import Any, Optional

from sqlmodel import SQLModel


class HorarioRead(SQLModel):
    dia: str
    hora_inicio: datetime.time
    hora_fin: datetime.time


class GrupoRead(SQLModel):
    id: int
    asignatura_id: int
    asignatura_codigo: Optional[str] = None
    asignatura_nombre: Optional[str] = None
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
    sede: str
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


class HistoriaAcademicaRead(SQLModel):
    plan_codigo: Optional[str] = None
    plan_nombre: Optional[str] = None
    facultad: Optional[str] = None
    porcentaje_avance: Optional[float] = None
    promedio_acumulado: Optional[float] = None
    papa_acumulado: Optional[float] = None
    asignaturas: list[dict[str, Any]] = []
    resumen_creditos: list[dict[str, Any]] = []


class HistoriaAcademicaInput(SQLModel):
    text: str

import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Facultad(SQLModel, table=True):
    __tablename__ = "facultad"

    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(unique=True, index=True)
    nombre: str


class PlanEstudios(SQLModel, table=True):
    __tablename__ = "plan_estudios"

    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(unique=True, index=True)
    nombre: str
    nivel: str  # pregrado | doctorado | postgrado
    facultad_id: int = Field(foreign_key="facultad.id")


class Asignatura(SQLModel, table=True):
    __tablename__ = "asignatura"

    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(unique=True, index=True)
    nombre: str
    creditos: Optional[int] = None
    tipologia: Optional[str] = None
    descripcion: Optional[str] = None


class AsignaturaPlan(SQLModel, table=True):
    __tablename__ = "asignatura_plan"

    asignatura_id: int = Field(foreign_key="asignatura.id", primary_key=True)
    plan_estudios_id: int = Field(foreign_key="plan_estudios.id", primary_key=True)


class Grupo(SQLModel, table=True):
    __tablename__ = "grupo"

    id: Optional[int] = Field(default=None, primary_key=True)
    asignatura_id: int = Field(foreign_key="asignatura.id", index=True)
    numero: int
    profesor: Optional[str] = None
    jornada: Optional[str] = None
    cupos_disponibles: Optional[int] = None
    fecha_inicio: Optional[datetime.date] = None
    fecha_fin: Optional[datetime.date] = None
    scraped_at: datetime.datetime


class GrupoHorario(SQLModel, table=True):
    __tablename__ = "grupo_horario"

    id: Optional[int] = Field(default=None, primary_key=True)
    grupo_id: int = Field(foreign_key="grupo.id", index=True)
    dia: str
    hora_inicio: datetime.time
    hora_fin: datetime.time

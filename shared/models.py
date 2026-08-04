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


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: Optional[int] = Field(default=None, primary_key=True)
    auth0_sub: str = Field(unique=True, index=True)
    email: str
    nombre: Optional[str] = None
    created_at: datetime.datetime


class UsuarioGrupo(SQLModel, table=True):
    """A group the user has added to their in-progress schedule."""

    __tablename__ = "usuario_grupo"

    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    grupo_id: int = Field(foreign_key="grupo.id", primary_key=True)
    added_at: datetime.datetime


class UsuarioPlan(SQLModel, table=True):
    """A plan de estudios (carrera) the user is enrolled in. A student can
    have more than one at once (e.g. pregrado + posgrado, or a double
    program), so this is many-to-many rather than a single field on Usuario.
    """

    __tablename__ = "usuario_plan"

    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    plan_estudios_id: int = Field(foreign_key="plan_estudios.id", primary_key=True)
    added_at: datetime.datetime

import datetime
from typing import Any, Optional

from sqlalchemy import Column, JSON, UniqueConstraint
from sqlmodel import Field, SQLModel


class Facultad(SQLModel, table=True):
    """A facultad belongs to exactly one sede. The same institutional
    codigo could in principle be reused across sedes (unconfirmed until
    every sede is scraped), so the two together are the real identity --
    not codigo alone."""

    __tablename__ = "facultad"
    __table_args__ = (UniqueConstraint("codigo", "sede", name="uq_facultad_codigo_sede"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(index=True)
    sede: str = Field(index=True)
    nombre: str


class PlanEstudios(SQLModel, table=True):
    """The same codigo can be reused for what SIA considers 'the same'
    nationally-registered program taught at more than one sede (confirmed:
    '3501 ARQUITECTURA' exists under both Medellin's and Amazonia's
    Facultad de Arquitectura). Each sede's offering has its own facultad,
    asignaturas and grupos though, so codigo alone can't be the identity --
    (codigo, facultad_id) is."""

    __tablename__ = "plan_estudios"
    __table_args__ = (UniqueConstraint("codigo", "facultad_id", name="uq_plan_codigo_facultad"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(index=True)
    nombre: str
    nivel: str  # pregrado | doctorado | postgrado
    facultad_id: int = Field(foreign_key="facultad.id")


class Asignatura(SQLModel, table=True):
    """Same reuse-across-sedes issue as PlanEstudios -- confirmed the hard
    way: fundamentacion courses (INGLES I, CALCULO DIFERENCIAL, etc.) share
    a codigo across every sede, but each sede runs its own grupos/horarios
    for it. Scoped by (codigo, sede), not codigo alone."""

    __tablename__ = "asignatura"
    __table_args__ = (UniqueConstraint("codigo", "sede", name="uq_asignatura_codigo_sede"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(index=True)
    sede: str = Field(index=True)
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
    aula: Optional[str] = None


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


class HistoriaAcademica(SQLModel, table=True):
    """A student's transcript, as pasted from SIA's "Historia Academica"
    page and parsed by app.historia_parser. One per usuario -- pasting again
    replaces it."""

    __tablename__ = "historia_academica"

    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    plan_codigo: Optional[str] = None
    plan_nombre: Optional[str] = None
    facultad: Optional[str] = None
    porcentaje_avance: Optional[float] = None
    promedio_acumulado: Optional[float] = None
    papa_acumulado: Optional[float] = None
    asignaturas: list[Any] = Field(sa_column=Column(JSON))
    resumen_creditos: list[Any] = Field(sa_column=Column(JSON))
    actualizado_at: datetime.datetime

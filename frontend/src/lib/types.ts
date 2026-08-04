export interface Horario {
  dia: string
  hora_inicio: string
  hora_fin: string
}

export interface Grupo {
  id: number
  asignatura_id: number
  asignatura_codigo: string | null
  asignatura_nombre: string | null
  numero: number
  profesor: string | null
  jornada: string | null
  cupos_disponibles: number | null
  fecha_inicio: string | null
  fecha_fin: string | null
  horarios: Horario[]
}

export interface Asignatura {
  id: number
  codigo: string
  nombre: string
  creditos: number | null
  tipologia: string | null
  descripcion: string | null
}

export interface AsignaturaDetail extends Asignatura {
  grupos: Grupo[]
}

export interface Facultad {
  id: number
  codigo: string
  nombre: string
}

export interface Plan {
  id: number
  codigo: string
  nombre: string
  nivel: string
  facultad_id: number
}

export interface Usuario {
  id: number
  email: string
  nombre: string | null
}

export interface AsignaturaHistorial {
  nombre: string
  codigo: string
  creditos: number
  tipo: string
  periodo: string
  modalidad: string
  calificacion: number | null
  estado: string
}

export interface ResumenCreditos {
  tipologia: string
  exigidos: number
  aprobados: number
  pendientes: number
  inscritos: number
  cursados: number
}

export interface HistoriaAcademica {
  plan_codigo: string | null
  plan_nombre: string | null
  facultad: string | null
  porcentaje_avance: number | null
  promedio_acumulado: number | null
  papa_acumulado: number | null
  asignaturas: AsignaturaHistorial[]
  resumen_creditos: ResumenCreditos[]
}

export const NIVELES = ["pregrado", "doctorado", "postgrado"] as const
export type Nivel = (typeof NIVELES)[number]

export const NIVEL_LABELS: Record<string, string> = {
  pregrado: "Pregrado",
  doctorado: "Doctorado",
  postgrado: "Posgrado / Maestría",
}

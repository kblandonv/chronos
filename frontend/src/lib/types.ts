export interface Horario {
  dia: string
  hora_inicio: string
  hora_fin: string
  aula: string | null
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
  sede: string
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

export const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"]

export const COLORES_GRUPO = [
  "bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-500/20 dark:border-violet-500/40 dark:text-violet-100",
  "bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-500/20 dark:border-sky-500/40 dark:text-sky-100",
  "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-100",
  "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-100",
  "bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-100",
]

export const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
}

export const SEDE_LABELS: Record<string, string> = {
  amazonia: "Sede Amazonia",
  bogota: "Sede Bogotá",
  caribe: "Sede Caribe",
  de_la_paz: "Sede De La Paz",
  manizales: "Sede Manizales",
  medellin: "Sede Medellín",
  orinoquia: "Sede Orinoquia",
  palmira: "Sede Palmira",
  tumaco: "Sede Tumaco",
}

import type { Grupo, Plan } from "./types"

const HORARIO_KEY = "chronos:horario"
const PLANES_KEY = "chronos:planes"
const HISTORIA_KEY = "chronos:historia"

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

export function seCruzan(a: Grupo, b: Grupo): boolean {
  return a.horarios.some((h1) =>
    b.horarios.some((h2) => h1.dia === h2.dia && h1.hora_inicio < h2.hora_fin && h2.hora_inicio < h1.hora_fin),
  )
}

export const localHorario = {
  list: (): Grupo[] => read<Grupo>(HORARIO_KEY),
  add: (grupo: Grupo) => {
    const items = read<Grupo>(HORARIO_KEY)
    if (!items.some((g) => g.id === grupo.id)) write(HORARIO_KEY, [...items, grupo])
  },
  remove: (grupoId: number) => {
    write(HORARIO_KEY, read<Grupo>(HORARIO_KEY).filter((g) => g.id !== grupoId))
  },
  clear: () => localStorage.removeItem(HORARIO_KEY),
}

export const localPlanes = {
  list: (): Plan[] => read<Plan>(PLANES_KEY),
  add: (plan: Plan) => {
    const items = read<Plan>(PLANES_KEY)
    if (!items.some((p) => p.id === plan.id)) write(PLANES_KEY, [...items, plan])
  },
  remove: (planId: number) => {
    write(PLANES_KEY, read<Plan>(PLANES_KEY).filter((p) => p.id !== planId))
  },
  clear: () => localStorage.removeItem(PLANES_KEY),
}

export const localHistoria = {
  // The raw pasted text is the source of truth (not the parsed result) so
  // there's a single migration path on login: just PUT the same text.
  getRaw: (): string | null => localStorage.getItem(HISTORIA_KEY),
  setRaw: (text: string) => localStorage.setItem(HISTORIA_KEY, text),
  clear: () => localStorage.removeItem(HISTORIA_KEY),
}

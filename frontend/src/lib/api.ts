import type { Asignatura, AsignaturaDetail, Facultad, Grupo, HistoriaAcademica, Plan, Usuario } from "./types"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail: unknown) {
    super(`API error ${status}`)
    this.status = status
    this.detail = detail
  }
}

async function request<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text()
    }
    const detail = body && typeof body === "object" && "detail" in body ? (body as { detail: unknown }).detail : body
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  niveles: () => request<string[]>("/catalogo/niveles"),
  facultades: (nivel?: string) => request<Facultad[]>(`/catalogo/facultades${nivel ? `?nivel=${nivel}` : ""}`),
  planes: (facultadId: number) => request<Plan[]>(`/catalogo/facultades/${facultadId}/planes`),
  tipologias: (planId: number) => request<string[]>(`/catalogo/planes/${planId}/tipologias`),
  asignaturas: (planId: number, tipologia?: string) =>
    request<Asignatura[]>(
      `/catalogo/planes/${planId}/asignaturas${tipologia ? `?tipologia=${encodeURIComponent(tipologia)}` : ""}`,
    ),
  asignatura: (id: number) => request<AsignaturaDetail>(`/catalogo/asignaturas/${id}`),
  buscarAsignaturas: (q: string) => request<Asignatura[]>(`/catalogo/asignaturas?q=${encodeURIComponent(q)}`),

  me: (token: string) => request<Usuario>("/me", token),
  horario: (token: string) => request<Grupo[]>("/me/horario", token),
  agregarGrupo: (token: string, grupoId: number) =>
    request<Grupo>(`/me/horario/${grupoId}`, token, { method: "POST" }),
  quitarGrupo: (token: string, grupoId: number) =>
    request<void>(`/me/horario/${grupoId}`, token, { method: "DELETE" }),

  misPlanes: (token: string) => request<Plan[]>("/me/planes", token),
  agregarPlan: (token: string, planId: number) =>
    request<Plan>(`/me/planes/${planId}`, token, { method: "POST" }),
  quitarPlan: (token: string, planId: number) =>
    request<void>(`/me/planes/${planId}`, token, { method: "DELETE" }),

  parseHistoria: (text: string) =>
    request<HistoriaAcademica>("/historia/parse", undefined, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  miHistoria: (token: string) => request<HistoriaAcademica>("/me/historia", token),
  guardarHistoria: (token: string, text: string) =>
    request<HistoriaAcademica>("/me/historia", token, {
      method: "PUT",
      body: JSON.stringify({ text }),
    }),
}

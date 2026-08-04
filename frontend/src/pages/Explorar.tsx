import { useEffect, useState } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { ApiError, api } from "../lib/api"
import { useHorarioStore } from "../lib/useHorarioStore"
import { NIVELES, NIVEL_LABELS, type Asignatura, type AsignaturaDetail, type Facultad, type Grupo, type Plan } from "../lib/types"

export default function Explorar() {
  const { isAuthenticated } = useAuth0()
  const horarioStore = useHorarioStore()

  const [nivel, setNivel] = useState<string>(NIVELES[0])
  const [facultades, setFacultades] = useState<Facultad[]>([])
  const [facultadId, setFacultadId] = useState<number | null>(null)
  const [planes, setPlanes] = useState<Plan[]>([])
  const [planId, setPlanId] = useState<number | null>(null)
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [seleccion, setSeleccion] = useState<AsignaturaDetail | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    setFacultadId(null)
    api.facultades(nivel).then(setFacultades)
  }, [nivel])

  useEffect(() => {
    setPlanId(null)
    setAsignaturas([])
    setSeleccion(null)
    if (facultadId != null) api.planes(facultadId).then(setPlanes)
    else setPlanes([])
  }, [facultadId])

  useEffect(() => {
    setSeleccion(null)
    if (planId != null) api.asignaturas(planId).then(setAsignaturas)
    else setAsignaturas([])
  }, [planId])

  async function verAsignatura(id: number) {
    setSeleccion(await api.asignatura(id))
  }

  async function agregar(grupo: Grupo) {
    setMensaje(null)
    try {
      await horarioStore.agregar(grupo)
      setMensaje(
        isAuthenticated
          ? "Grupo agregado a tu horario."
          : "Grupo agregado a tu horario (guardado en este navegador — inicia sesión para no perderlo).",
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const detail = err.detail as { message?: string }
        setMensaje(detail.message ?? "Este grupo cruza con otro que ya tienes en tu horario.")
      } else if (err instanceof ApiError && err.status === 404) {
        setMensaje("Ya habías agregado este grupo antes.")
      } else {
        setMensaje("No se pudo agregar el grupo, intenta de nuevo.")
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Explorar asignaturas</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sede Medellín</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {NIVELES.map((n) => (
            <option key={n} value={n}>
              {NIVEL_LABELS[n]}
            </option>
          ))}
        </select>
        <select
          value={facultadId ?? ""}
          onChange={(e) => setFacultadId(e.target.value ? Number(e.target.value) : null)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Facultad...</option>
          {facultades.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
        <select
          value={planId ?? ""}
          onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : null)}
          disabled={facultadId == null}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Plan de estudios...</option>
          {planes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.codigo})
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">Asignaturas</h2>
          {asignaturas.length === 0 ? (
            <p className="text-sm text-slate-500">Elige facultad y plan para ver las asignaturas.</p>
          ) : (
            <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {asignaturas.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => verAsignatura(a.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm hover:border-violet-400 ${
                      seleccion?.id === a.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <p className="font-medium text-slate-900 dark:text-white">{a.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {a.codigo} · {a.creditos ?? "?"} créditos
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">Grupos</h2>
          {mensaje && (
            <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {mensaje}
            </p>
          )}
          {!seleccion ? (
            <p className="text-sm text-slate-500">Elige una asignatura para ver sus grupos.</p>
          ) : seleccion.grupos.length === 0 ? (
            <p className="text-sm text-slate-500">Esta asignatura no tiene grupos abiertos ahora mismo.</p>
          ) : (
            <ul className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
              {seleccion.grupos.map((g) => (
                <li key={g.id} className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Grupo {g.numero}</p>
                      <p className="text-slate-500">{g.profesor ?? "Sin profesor asignado"}</p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-500">
                        {g.horarios.map((h, i) => (
                          <li key={i}>
                            {h.dia} {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-slate-400">Cupos: {g.cupos_disponibles ?? "?"}</p>
                    </div>
                    <button
                      onClick={() => agregar(g)}
                      className="shrink-0 rounded-full bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
                    >
                      Agregar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

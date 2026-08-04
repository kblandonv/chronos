import { useEffect, useState } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { api } from "../lib/api"
import { usePlanesStore } from "../lib/usePlanesStore"
import { NIVELES, NIVEL_LABELS, SEDE_LABELS, type Facultad, type Plan } from "../lib/types"

export default function Perfil() {
  const { user, isAuthenticated, loginWithRedirect } = useAuth0()
  const planesStore = usePlanesStore()

  const [misPlanes, setMisPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const [sedes, setSedes] = useState<string[]>([])
  const [sede, setSede] = useState<string>("")
  const [nivel, setNivel] = useState<string>(NIVELES[0])
  const [facultades, setFacultades] = useState<Facultad[]>([])
  const [facultadId, setFacultadId] = useState<number | null>(null)
  const [planes, setPlanes] = useState<Plan[]>([])
  const [planId, setPlanId] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    planesStore
      .listar()
      .then(setMisPlanes)
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    api.sedes().then((s) => {
      setSedes(s)
      setSede((current) => current || (s.includes("medellin") ? "medellin" : s[0]) || "")
    })
  }, [])

  useEffect(() => {
    setFacultadId(null)
    setPlanes([])
    setPlanId(null)
    if (sede) api.facultades(nivel, sede).then(setFacultades)
    else setFacultades([])
  }, [nivel, sede])

  useEffect(() => {
    setPlanId(null)
    if (facultadId == null) {
      setPlanes([])
      return
    }
    api.planes(facultadId).then(setPlanes)
  }, [facultadId])

  async function agregarCarrera() {
    const seleccionado = planes.find((p) => p.id === planId)
    if (!seleccionado) return
    setGuardando(true)
    try {
      const plan = await planesStore.agregar(seleccionado)
      setMisPlanes((prev) => (prev.some((p) => p.id === plan.id) ? prev : [...prev, plan]))
      setPlanId(null)
    } finally {
      setGuardando(false)
    }
  }

  async function quitarCarrera(id: number) {
    await planesStore.quitar(id)
    setMisPlanes((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Mi perfil</h1>

      {isAuthenticated ? (
        <p className="mt-1 text-slate-600 dark:text-slate-400">{user?.email}</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span>Estás sin cuenta: tus carreras se guardan solo en este navegador.</span>
          <button
            onClick={() => loginWithRedirect()}
            className="shrink-0 rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500"
          >
            Iniciar sesión para guardarlas
          </button>
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white">Mis carreras</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Puedes tener más de una — pregrado, posgrado, o ambas — y elegir el plan nuevo o el viejo
          si tu programa tiene los dos (se distinguen por el código).
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Cargando...</p>
        ) : misPlanes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Todavía no agregaste ninguna carrera.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {misPlanes.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{p.nombre}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {NIVEL_LABELS[p.nivel] ?? p.nivel} · código {p.codigo}
                  </p>
                </div>
                <button
                  onClick={() => quitarCarrera(p.id)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Agregar carrera</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={sede}
              onChange={(e) => setSede(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {sedes.map((s) => (
                <option key={s} value={s}>
                  {SEDE_LABELS[s] ?? s}
                </option>
              ))}
            </select>
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
          <button
            onClick={agregarCarrera}
            disabled={planId == null || guardando}
            className="mt-4 rounded-full bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </section>
    </div>
  )
}

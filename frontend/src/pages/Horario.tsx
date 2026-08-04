import { useEffect, useState } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import WeeklyCalendar from "../components/WeeklyCalendar"
import { exportToExcel, exportToICS } from "../lib/exportHorario"
import { useHorarioStore } from "../lib/useHorarioStore"
import { useIsMobile } from "../lib/useIsMobile"
import { COLORES_GRUPO, type Grupo } from "../lib/types"

export default function Horario() {
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const horarioStore = useHorarioStore()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    horarioStore
      .listar()
      .then(setGrupos)
      .catch(() => setError("No se pudo cargar tu horario. Revisa tu conexión e intenta de nuevo."))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  async function quitar(grupoId: number) {
    try {
      await horarioStore.quitar(grupoId)
      setGrupos((prev) => prev.filter((g) => g.id !== grupoId))
    } catch {
      setError("No se pudo quitar el grupo, intenta de nuevo.")
    }
  }

  const colorPorGrupo = new Map(grupos.map((g, i) => [g.id, COLORES_GRUPO[i % COLORES_GRUPO.length]]))

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Mi horario</h1>
        {grupos.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => exportToExcel(grupos)}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Exportar a Excel
            </button>
            <button
              onClick={() => exportToICS(grupos)}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Agregar a calendario
            </button>
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span>Estás sin cuenta: este horario se guarda solo en este navegador.</span>
          <button
            onClick={() => loginWithRedirect()}
            className="shrink-0 rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500"
          >
            Iniciar sesión para guardarlo
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Cargando...</p>
      ) : grupos.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          Todavía no agregaste ningún grupo. Ve a{" "}
          <a href="/explorar" className="text-violet-600 hover:underline dark:text-violet-400">
            Explorar
          </a>{" "}
          para armar tu horario.
        </p>
      ) : (
        <>
          <div className="mt-8">
            <WeeklyCalendar grupos={grupos} compact={isMobile} />
          </div>

          <ul className="mt-10 space-y-2">
            {grupos.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 shrink-0 rounded-full border ${colorPorGrupo.get(g.id)}`} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {g.asignatura_nombre ?? "Asignatura"} — Grupo {g.numero}
                    </p>
                    <p className="text-xs text-slate-500">
                      {g.profesor ?? "Sin profesor asignado"} · Cupos: {g.cupos_disponibles ?? "?"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => quitar(g.id)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

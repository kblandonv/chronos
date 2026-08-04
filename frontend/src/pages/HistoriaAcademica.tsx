import { useEffect, useState } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import AvanceCharacter from "../components/AvanceCharacter"
import PapaProjector from "../components/PapaProjector"
import { useHistoriaStore } from "../lib/useHistoriaStore"
import type { HistoriaAcademica as HistoriaAcademicaData } from "../lib/types"

const ESTADO_CLASSES: Record<string, string> = {
  APROBADA: "text-emerald-700 dark:text-emerald-400",
  REPROBADA: "text-red-600 dark:text-red-400",
}

export default function HistoriaAcademica() {
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const store = useHistoriaStore()

  const [texto, setTexto] = useState("")
  const [historia, setHistoria] = useState<HistoriaAcademicaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    store
      .obtener()
      .then(setHistoria)
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  async function procesar() {
    if (!texto.trim()) return
    setProcesando(true)
    setError(null)
    try {
      const parsed = await store.guardar(texto)
      setHistoria(parsed)
      setTexto("")
    } catch {
      setError("No se pudo leer el texto pegado. Asegúrate de copiar toda la página de Historia Académica.")
    } finally {
      setProcesando(false)
    }
  }

  const asignaturasOrdenadas = historia
    ? [...historia.asignaturas].sort((a, b) => b.periodo.localeCompare(a.periodo))
    : []

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Mi historia académica</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Ve a SIA → Información académica → Historia Académica, presiona Ctrl/Cmd+A para
        seleccionar todo, copia, y pégalo aquí abajo. Chronos lo lee y te arma el resumen.
      </p>

      {!isAuthenticated && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span>Estás sin cuenta: esto se guarda solo en este navegador.</span>
          <button
            onClick={() => loginWithRedirect()}
            className="shrink-0 rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500"
          >
            Iniciar sesión para guardarlo
          </button>
        </div>
      )}

      <div className="mt-6">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pega aquí el contenido de la página Historia Académica del SIA..."
          rows={6}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          onClick={procesar}
          disabled={procesando || !texto.trim()}
          className="mt-3 rounded-full bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {procesando ? "Procesando..." : "Procesar"}
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-slate-500">Cargando...</p>
      ) : !historia ? (
        <p className="mt-10 text-sm text-slate-500">Todavía no pegaste tu historia académica.</p>
      ) : (
        <div className="mt-10 space-y-10">
          <section className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  {historia.plan_nombre ?? "Plan de estudios"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {historia.facultad} · código {historia.plan_codigo}
                </p>
                <div className="mt-4 flex gap-6 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Promedio acumulado</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {historia.promedio_acumulado ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">P.A.P.A</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {historia.papa_acumulado ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-xs sm:w-64">
                <AvanceCharacter porcentaje={historia.porcentaje_avance ?? 0} />
              </div>
            </div>
          </section>

          {historia.resumen_creditos.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
                Créditos por tipología
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[500px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Tipología</th>
                      <th className="px-4 py-2">Exigidos</th>
                      <th className="px-4 py-2">Aprobados</th>
                      <th className="px-4 py-2">Pendientes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historia.resumen_creditos.map((r) => (
                      <tr key={r.tipologia} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{r.tipologia}</td>
                        <td className="px-4 py-2">{r.exigidos}</td>
                        <td className="px-4 py-2">{r.aprobados}</td>
                        <td className="px-4 py-2">{r.pendientes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <PapaProjector asignaturas={historia.asignaturas} papaActual={historia.papa_acumulado} />

          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
              Asignaturas cursadas ({asignaturasOrdenadas.length})
            </h2>
            <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {asignaturasOrdenadas.map((a, i) => (
                <div
                  key={`${a.codigo}-${a.periodo}-${i}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{a.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {a.codigo} · {a.creditos} créditos · {a.periodo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${ESTADO_CLASSES[a.estado] ?? "text-slate-500"}`}>{a.estado}</p>
                    {a.calificacion != null && <p className="text-xs text-slate-500">Nota: {a.calificacion}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

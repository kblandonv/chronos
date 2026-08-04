import { useEffect, useState } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { exportToExcel, exportToICS } from "../lib/exportHorario"
import { useHorarioStore } from "../lib/useHorarioStore"
import { DIAS, DIA_LABELS, type Grupo } from "../lib/types"

const HORA_INICIO = 6
const HORA_FIN = 22
const PX_POR_HORA = 56

const COLORES = [
  "bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-500/20 dark:border-violet-500/40 dark:text-violet-100",
  "bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-500/20 dark:border-sky-500/40 dark:text-sky-100",
  "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-100",
  "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-100",
  "bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-100",
]

function minutosDesdeInicio(hora: string) {
  const [h, m] = hora.split(":").map(Number)
  return (h - HORA_INICIO) * 60 + m
}

export default function Horario() {
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const horarioStore = useHorarioStore()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    horarioStore
      .listar()
      .then(setGrupos)
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  async function quitar(grupoId: number) {
    await horarioStore.quitar(grupoId)
    setGrupos((prev) => prev.filter((g) => g.id !== grupoId))
  }

  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
  const diasVisibles = DIAS.filter(
    (d) => d !== "DOMINGO" && d !== "SABADO" ? true : grupos.some((g) => g.horarios.some((h) => h.dia === d)),
  )
  const colorPorGrupo = new Map(grupos.map((g, i) => [g.id, COLORES[i % COLORES.length]]))

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
          <div className="mt-8 overflow-x-auto">
            <div
              className="grid min-w-[720px]"
              style={{ gridTemplateColumns: `52px repeat(${diasVisibles.length}, 1fr)` }}
            >
              <div />
              {diasVisibles.map((d) => (
                <div
                  key={d}
                  className="px-2 pb-2 text-center text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {DIA_LABELS[d]}
                </div>
              ))}

              <div className="relative" style={{ height: (HORA_FIN - HORA_INICIO) * PX_POR_HORA }}>
                {horas.map((h) => (
                  <div
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-xs text-slate-400"
                    style={{ top: (h - HORA_INICIO) * PX_POR_HORA }}
                  >
                    {h}:00
                  </div>
                ))}
              </div>

              {diasVisibles.map((dia) => (
                <div
                  key={dia}
                  className="relative border-l border-slate-200 dark:border-slate-800"
                  style={{ height: (HORA_FIN - HORA_INICIO) * PX_POR_HORA }}
                >
                  {horas.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-slate-100 dark:border-slate-900"
                      style={{ top: (h - HORA_INICIO) * PX_POR_HORA }}
                    />
                  ))}
                  {grupos.flatMap((g) =>
                    g.horarios
                      .filter((h) => h.dia === dia)
                      .map((h, hi) => {
                        const top = minutosDesdeInicio(h.hora_inicio) * (PX_POR_HORA / 60)
                        const height =
                          (minutosDesdeInicio(h.hora_fin) - minutosDesdeInicio(h.hora_inicio)) *
                          (PX_POR_HORA / 60)
                        return (
                          <div
                            key={`${g.id}-${hi}`}
                            className={`absolute inset-x-1 overflow-hidden rounded-lg border p-1.5 text-[11px] leading-tight ${colorPorGrupo.get(g.id)}`}
                            style={{ top, height: Math.max(height, 40) }}
                          >
                            <p className="truncate font-semibold">{g.asignatura_nombre ?? "Asignatura"}</p>
                            <p className="truncate">Grupo {g.numero}</p>
                            <p className="truncate">{g.profesor ?? "Sin profesor"}</p>
                            <p className="truncate">Cupos: {g.cupos_disponibles ?? "?"}</p>
                          </div>
                        )
                      }),
                  )}
                </div>
              ))}
            </div>
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

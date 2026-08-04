import { useEffect, useState } from "react"
import { useApi } from "../lib/useApi"
import type { Grupo } from "../lib/types"

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"]
const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
}
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
  const apiMe = useApi()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiMe
      .horario()
      .then(setGrupos)
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function quitar(grupoId: number) {
    await apiMe.quitarGrupo(grupoId)
    setGrupos((prev) => prev.filter((g) => g.id !== grupoId))
  }

  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
  const diasVisibles = DIAS.filter(
    (d) => d !== "DOMINGO" && d !== "SABADO" ? true : grupos.some((g) => g.horarios.some((h) => h.dia === d)),
  )
  const colorPorGrupo = new Map(grupos.map((g, i) => [g.id, COLORES[i % COLORES.length]]))

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Mi horario</h1>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Cargando...</p>
      ) : grupos.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          Todavía no agregaste ningún grupo. Andá a{" "}
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
                            style={{ top, height: Math.max(height, 24) }}
                          >
                            <p className="truncate font-semibold">{g.asignatura_nombre ?? "Asignatura"}</p>
                            <p>Grupo {g.numero}</p>
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
                    <p className="text-xs text-slate-500">{g.profesor ?? "Sin profesor asignado"}</p>
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

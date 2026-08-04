import { COLORES_GRUPO, DIAS, DIA_LABELS, type Grupo } from "../lib/types"

function minutosDesdeInicio(hora: string, horaInicio: number) {
  const [h, m] = hora.split(":").map(Number)
  return (h - horaInicio) * 60 + m
}

interface Props {
  grupos: Grupo[]
  /** A grupo the user is considering but hasn't added yet -- shown as a
   * dashed ghost block so they can see where it'd land without leaving
   * the page. */
  preview?: Grupo | null
  compact?: boolean
}

export default function WeeklyCalendar({ grupos, preview, compact = false }: Props) {
  const HORA_INICIO = compact ? 6 : 6
  const HORA_FIN = compact ? 21 : 22
  const PX_POR_HORA = compact ? 34 : 56

  const todos = preview ? [...grupos, preview] : grupos
  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
  const diasVisibles = DIAS.filter((d) =>
    d !== "DOMINGO" && d !== "SABADO" ? true : todos.some((g) => g.horarios.some((h) => h.dia === d)),
  )
  const colorPorGrupo = new Map(grupos.map((g, i) => [g.id, COLORES_GRUPO[i % COLORES_GRUPO.length]]))
  const altoTotal = (HORA_FIN - HORA_INICIO) * PX_POR_HORA
  const primeraCol = compact ? 36 : 52

  return (
    <div className="overflow-x-auto">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${primeraCol}px repeat(${diasVisibles.length}, 1fr)`,
          minWidth: compact ? undefined : 720,
        }}
      >
        <div />
        {diasVisibles.map((d) => (
          <div
            key={d}
            className={`px-1 pb-2 text-center font-medium text-slate-700 dark:text-slate-300 ${compact ? "text-xs" : "text-sm"}`}
          >
            {compact ? DIA_LABELS[d]?.slice(0, 3) : DIA_LABELS[d]}
          </div>
        ))}

        <div className="relative" style={{ height: altoTotal }}>
          {horas.map((h) => (
            <div
              key={h}
              className="absolute right-1 -translate-y-1/2 text-[10px] text-slate-400"
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
            style={{ height: altoTotal }}
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
                  const top = minutosDesdeInicio(h.hora_inicio, HORA_INICIO) * (PX_POR_HORA / 60)
                  const height =
                    (minutosDesdeInicio(h.hora_fin, HORA_INICIO) - minutosDesdeInicio(h.hora_inicio, HORA_INICIO)) *
                    (PX_POR_HORA / 60)
                  return (
                    <div
                      key={`${g.id}-${hi}`}
                      className={`absolute inset-x-0.5 overflow-hidden rounded-md border p-1 leading-tight ${compact ? "text-[9px]" : "text-[11px]"} ${colorPorGrupo.get(g.id)}`}
                      style={{ top, height: Math.max(height, compact ? 24 : 56) }}
                    >
                      <p className="truncate font-semibold">{g.asignatura_nombre ?? "Asignatura"}</p>
                      {!compact && (
                        <>
                          <p className="truncate">Grupo {g.numero}</p>
                          <p className="truncate">{g.profesor ?? "Sin profesor"}</p>
                          <p className="truncate">Cupos: {g.cupos_disponibles ?? "?"}</p>
                          {h.aula && <p className="truncate">{h.aula}</p>}
                        </>
                      )}
                    </div>
                  )
                }),
            )}
            {preview?.horarios
              .filter((h) => h.dia === dia)
              .map((h, hi) => {
                const top = minutosDesdeInicio(h.hora_inicio, HORA_INICIO) * (PX_POR_HORA / 60)
                const height =
                  (minutosDesdeInicio(h.hora_fin, HORA_INICIO) - minutosDesdeInicio(h.hora_inicio, HORA_INICIO)) *
                  (PX_POR_HORA / 60)
                return (
                  <div
                    key={`preview-${hi}`}
                    className={`absolute inset-x-0.5 overflow-hidden rounded-md border-2 border-dashed border-violet-500 bg-violet-500/10 p-1 leading-tight text-violet-700 dark:text-violet-300 ${compact ? "text-[9px]" : "text-[11px]"}`}
                    style={{ top, height: Math.max(height, compact ? 24 : 56) }}
                  >
                    <p className="truncate font-semibold">{preview.asignatura_nombre ?? "Asignatura"}</p>
                  </div>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}

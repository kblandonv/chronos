interface Props {
  porcentaje: number
}

/** A little character that grows as it walks toward the graduation cap --
 * literally scales with the progress percentage, to make the number feel
 * like something happening rather than a static stat. */
export default function AvanceCharacter({ porcentaje }: Props) {
  const pct = Math.max(0, Math.min(100, porcentaje))
  const scale = 0.7 + (pct / 100) * 0.8

  return (
    <div className="w-full">
      <div className="relative h-28 w-full px-2">
        <div className="absolute top-1/2 left-2 right-2 h-2 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div
          className="absolute top-1/2 left-2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
          style={{ width: `calc(${pct}% * (100% - 16px) / 100%)` }}
        />
        <div
          className="absolute top-1/2 -translate-y-[68px] transition-[left] duration-700 ease-out"
          style={{ left: `calc(${pct}% * (100% - 40px) / 100% + 8px)` }}
        >
          <span
            className="block origin-bottom text-4xl transition-transform duration-700 ease-out"
            style={{ transform: `scale(${scale})` }}
            role="img"
            aria-label={`avance ${pct}%`}
          >
            🧑‍🎓
          </span>
        </div>
        <span
          className="absolute top-1/2 right-2 -translate-y-1/2 translate-x-1/2 text-3xl"
          role="img"
          aria-label="meta: graduación"
        >
          🎓
        </span>
      </div>
      <p className="text-center text-2xl font-semibold text-slate-900 dark:text-white">
        {pct.toFixed(1)}%
      </p>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">de avance en la carrera</p>
    </div>
  )
}

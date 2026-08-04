import { useMemo, useState } from "react"
import type { AsignaturaHistorial } from "../lib/types"

interface FilaProyeccion {
  id: number
  nombre: string
  creditos: number
  nota: number
}

interface Props {
  asignaturas: AsignaturaHistorial[]
  papaActual: number | null
}

/**
 * P.A.P.A = sum(creditos * nota) / sum(creditos) across every asignatura
 * cursada (aprobada or reprobada) in every period -- including repeated
 * courses, since each attempt is its own "asignatura cursada" entry. Only
 * graded rows count (some rows, like language-proficiency credit, have no
 * numeric calificacion and don't factor into the average).
 */
export default function PapaProjector({ asignaturas, papaActual }: Props) {
  const [filas, setFilas] = useState<FilaProyeccion[]>([])
  const [nombre, setNombre] = useState("")
  const [creditos, setCreditos] = useState("")
  const [nota, setNota] = useState("")

  const { sumaHistorica, creditosHistoricos } = useMemo(() => {
    let suma = 0
    let creditos = 0
    for (const a of asignaturas) {
      if (a.calificacion != null) {
        suma += a.creditos * a.calificacion
        creditos += a.creditos
      }
    }
    return { sumaHistorica: suma, creditosHistoricos: creditos }
  }, [asignaturas])

  const sumaProyeccion = filas.reduce((acc, f) => acc + f.creditos * f.nota, 0)
  const creditosProyeccion = filas.reduce((acc, f) => acc + f.creditos, 0)
  const totalCreditos = creditosHistoricos + creditosProyeccion
  // With nothing added yet, show the same number as "actual" -- otherwise
  // recomputing from raw sums (more decimals than SIA's rounded self-report)
  // would show a slightly different value with zero actual changes, which
  // reads as a bug rather than a rounding difference.
  const papaProyectado =
    filas.length === 0 ? papaActual : totalCreditos > 0 ? (sumaHistorica + sumaProyeccion) / totalCreditos : null

  function agregar() {
    const c = Number(creditos)
    const n = Number(nota)
    if (!c || c <= 0 || Number.isNaN(n) || n < 0 || n > 5) return
    setFilas((prev) => [
      ...prev,
      { id: prev.length ? Math.max(...prev.map((f) => f.id)) + 1 : 1, nombre: nombre.trim() || "Asignatura", creditos: c, nota: n },
    ])
    setNombre("")
    setCreditos("")
    setNota("")
  }

  function quitar(id: number) {
    setFilas((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <section>
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-slate-500">
        Proyectar P.A.P.A del próximo semestre
      </h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Agregá las asignaturas que estás cursando con la nota que esperás sacar, y calculamos cómo quedaría tu
        P.A.P.A sumando eso a tu historial.
      </p>

      {filas.length > 0 && (
        <ul className="mb-4 space-y-2">
          {filas.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800"
            >
              <span className="text-slate-700 dark:text-slate-200">
                {f.nombre} · {f.creditos} créditos · nota {f.nota}
              </span>
              <button onClick={() => quitar(f.id)} className="text-sm text-red-600 hover:underline dark:text-red-400">
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Asignatura (opcional)"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
        />
        <input
          value={creditos}
          onChange={(e) => setCreditos(e.target.value)}
          type="number"
          min="1"
          placeholder="Créditos"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
        />
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          type="number"
          min="0"
          max="5"
          step="0.1"
          placeholder="Nota est."
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
        />
        <button
          onClick={agregar}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Agregar
        </button>
      </div>

      <div className="mt-6 flex gap-10">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">P.A.P.A actual</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{papaActual?.toFixed(2) ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">P.A.P.A proyectado</p>
          <p className="text-2xl font-semibold text-violet-600 dark:text-violet-400">
            {papaProyectado != null ? papaProyectado.toFixed(2) : "—"}
          </p>
        </div>
      </div>
    </section>
  )
}

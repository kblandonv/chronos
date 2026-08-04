import { useEffect, useState } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import WeeklyCalendar from "../components/WeeklyCalendar"
import { ApiError, api } from "../lib/api"
import { seCruzan } from "../lib/localStore"
import { useHorarioStore } from "../lib/useHorarioStore"
import { NIVELES, NIVEL_LABELS, SEDE_LABELS, type Asignatura, type AsignaturaDetail, type Facultad, type Grupo, type Plan } from "../lib/types"

export default function Explorar() {
  const { isAuthenticated } = useAuth0()
  const horarioStore = useHorarioStore()

  const [miHorario, setMiHorario] = useState<Grupo[]>([])
  const [preview, setPreview] = useState<Grupo | null>(null)

  const [sedes, setSedes] = useState<string[]>([])
  const [sede, setSede] = useState<string>("")
  const [nivel, setNivel] = useState<string>(NIVELES[0])
  const [facultades, setFacultades] = useState<Facultad[]>([])
  const [facultadId, setFacultadId] = useState<number | null>(null)
  const [planes, setPlanes] = useState<Plan[]>([])
  const [planId, setPlanId] = useState<number | null>(null)
  const [tipologias, setTipologias] = useState<string[]>([])
  const [tipologia, setTipologia] = useState("")
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [seleccion, setSeleccion] = useState<AsignaturaDetail | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState("")
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Asignatura[]>([])
  const buscando = busqueda.trim().length >= 2

  const [cargandoSedes, setCargandoSedes] = useState(true)
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null)

  const errorGenerico = "No se pudo cargar la información. Revisa tu conexión e intenta de nuevo."

  useEffect(() => {
    if (!buscando) {
      setResultadosBusqueda([])
      return
    }
    const id = setTimeout(() => {
      api
        .buscarAsignaturas(busqueda.trim())
        .then((r) => {
          setResultadosBusqueda(r)
          setErrorCatalogo(null)
        })
        .catch(() => setErrorCatalogo(errorGenerico))
    }, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, buscando])

  useEffect(() => {
    horarioStore.listar().then(setMiHorario)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    setCargandoSedes(true)
    api
      .sedes()
      .then((s) => {
        setSedes(s)
        setSede((current) => current || (s.includes("medellin") ? "medellin" : s[0]) || "")
        setErrorCatalogo(null)
      })
      .catch(() => setErrorCatalogo(errorGenerico))
      .finally(() => setCargandoSedes(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setFacultadId(null)
    if (sede)
      api
        .facultades(nivel, sede)
        .then((f) => {
          setFacultades(f)
          setErrorCatalogo(null)
        })
        .catch(() => setErrorCatalogo(errorGenerico))
    else setFacultades([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivel, sede])

  useEffect(() => {
    setPlanId(null)
    setAsignaturas([])
    setSeleccion(null)
    if (facultadId != null)
      api
        .planes(facultadId, nivel)
        .then((p) => {
          setPlanes(p)
          setErrorCatalogo(null)
        })
        .catch(() => setErrorCatalogo(errorGenerico))
    else setPlanes([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultadId, nivel])

  useEffect(() => {
    setTipologia("")
    setSeleccion(null)
    if (planId != null)
      api
        .tipologias(planId)
        .then((t) => {
          setTipologias(t)
          setErrorCatalogo(null)
        })
        .catch(() => setErrorCatalogo(errorGenerico))
    else setTipologias([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId])

  useEffect(() => {
    setSeleccion(null)
    if (planId != null)
      api
        .asignaturas(planId, tipologia || undefined)
        .then((a) => {
          setAsignaturas(a)
          setErrorCatalogo(null)
        })
        .catch(() => setErrorCatalogo(errorGenerico))
    else setAsignaturas([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, tipologia])

  const listaAsignaturas = buscando ? resultadosBusqueda : asignaturas

  async function verAsignatura(id: number) {
    try {
      setSeleccion(await api.asignatura(id))
      setErrorCatalogo(null)
    } catch {
      setErrorCatalogo(errorGenerico)
    }
  }

  function conflictoDe(grupo: Grupo): Grupo | null {
    return miHorario.find((mg) => mg.id !== grupo.id && seCruzan(mg, grupo)) ?? null
  }

  function yaAgregado(grupo: Grupo): boolean {
    return miHorario.some((mg) => mg.id === grupo.id)
  }

  async function agregar(grupo: Grupo) {
    setMensaje(null)
    try {
      await horarioStore.agregar(grupo)
      setMiHorario((prev) => (prev.some((g) => g.id === grupo.id) ? prev : [...prev, grupo]))
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

  async function quitar(grupo: Grupo) {
    setMensaje(null)
    await horarioStore.quitar(grupo.id)
    setMiHorario((prev) => prev.filter((g) => g.id !== grupo.id))
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Explorar asignaturas</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {SEDE_LABELS[sede] ?? "Elige una sede"}
      </p>

      {errorCatalogo && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {errorCatalogo}
        </p>
      )}

      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar asignatura por nombre..."
        className="mt-6 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
      />

      <div className={`mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 ${buscando ? "opacity-50" : ""}`}>
        <select
          value={sede}
          onChange={(e) => setSede(e.target.value)}
          disabled={cargandoSedes}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
        >
          {cargandoSedes ? (
            <option>Cargando sedes...</option>
          ) : (
            sedes.map((s) => (
              <option key={s} value={s}>
                {SEDE_LABELS[s] ?? s}
              </option>
            ))
          )}
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
        <select
          value={tipologia}
          onChange={(e) => setTipologia(e.target.value)}
          disabled={planId == null}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Todos los tipos</option>
          {tipologias.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1.3fr]">
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
            {buscando ? `Resultados para "${busqueda.trim()}"` : "Asignaturas"}
          </h2>
          {listaAsignaturas.length === 0 ? (
            <p className="text-sm text-slate-500">
              {buscando
                ? "No encontramos asignaturas con ese nombre."
                : planId == null
                  ? "Elige facultad y plan para ver las asignaturas, o busca por nombre arriba."
                  : "No hay asignaturas de este tipo en el plan seleccionado."}
            </p>
          ) : (
            <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {listaAsignaturas.map((a) => (
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
              {seleccion.grupos.map((g) => {
                const conflicto = conflictoDe(g)
                const agregado = yaAgregado(g)
                return (
                  <li
                    key={g.id}
                    className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800"
                    onMouseEnter={() => setPreview(g)}
                    onMouseLeave={() => setPreview((p) => (p?.id === g.id ? null : p))}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Grupo {g.numero}</p>
                        <p className="text-slate-500">{g.profesor ?? "Sin profesor asignado"}</p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-500">
                          {g.horarios.map((h, i) => (
                            <li key={i}>
                              {h.dia} {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                              {h.aula && ` · ${h.aula}`}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-slate-400">Cupos: {g.cupos_disponibles ?? "?"}</p>
                        {conflicto && !agregado && (
                          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                            Cruza con {conflicto.asignatura_nombre ?? "otra asignatura"} (Grupo {conflicto.numero})
                          </p>
                        )}
                      </div>
                      {agregado ? (
                        <button
                          onClick={() => quitar(g)}
                          className="shrink-0 rounded-full border border-red-300 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          Quitar
                        </button>
                      ) : (
                        <button
                          onClick={() => agregar(g)}
                          disabled={!!conflicto}
                          className="shrink-0 rounded-full bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                        >
                          {conflicto ? "Cruza horario" : "Agregar"}
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
            Mi horario {preview && <span className="text-violet-500">(vista previa)</span>}
          </h2>
          {miHorario.length === 0 && !preview ? (
            <p className="text-sm text-slate-500">
              Todavía no tienes nada agregado. A medida que agregues grupos, los vas viendo acá.
            </p>
          ) : (
            <WeeklyCalendar grupos={miHorario} preview={preview} compact />
          )}
        </div>
      </div>
    </div>
  )
}

import { useAuth0 } from "@auth0/auth0-react"
import { Link } from "react-router-dom"
import AnimatedHero from "../components/AnimatedHero"

const FEATURES = [
  {
    title: "Catálogo completo",
    body: "Pregrado, posgrado y doctorado de todas las facultades de la sede, sincronizado directo del SIA.",
  },
  {
    title: "Cruces de horario",
    body: "Al agregar un grupo, Chronos avisa si choca con algo que ya tienes en tu horario.",
  },
  {
    title: "Tu perfil, tu carrera",
    body: "Configura tu(s) plan(es) de estudio -- pregrado, posgrado, o ambos -- y el plan nuevo o el viejo.",
  },
]

export default function Landing() {
  const { isAuthenticated, loginWithRedirect } = useAuth0()

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        <AnimatedHero />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center sm:py-36">
          <span className="mb-5 rounded-full border border-violet-300/60 bg-violet-50 px-4 py-1 text-sm font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
            Universidad Nacional de Colombia · Sede Medellín
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            Arma tu horario sin dolores de cabeza
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Chronos junta todo el catálogo de asignaturas del SIA en un solo lugar: elige tu
            facultad, tu plan de estudios, y arma tu semestre viendo los cruces de horario antes de
            matricular.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/horario"
                className="rounded-full bg-violet-600 px-6 py-3 font-medium text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500"
              >
                Ver mi horario
              </Link>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="rounded-full bg-violet-600 px-6 py-3 font-medium text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500"
              >
                Empezar con mi cuenta UNAL
              </button>
            )}
            <Link
              to="/explorar"
              className="rounded-full border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Explorar asignaturas
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-20 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

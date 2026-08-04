import { Link } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"

const linkClass =
  "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"

export default function NavBar() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Chronos
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/explorar" className={linkClass}>
            Explorar
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/horario" className={linkClass}>
                Mi horario
              </Link>
              <Link to="/perfil" className={linkClass}>
                Mi perfil
              </Link>
            </>
          )}
          {!isLoading &&
            (isAuthenticated ? (
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="rounded-full bg-slate-100 px-4 py-1.5 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Salir{user?.given_name ? ` (${user.given_name})` : ""}
              </button>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="rounded-full bg-violet-600 px-4 py-1.5 text-white hover:bg-violet-500"
              >
                Iniciar sesión
              </button>
            ))}
        </nav>
      </div>
    </header>
  )
}

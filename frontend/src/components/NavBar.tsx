import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"

const linkClass = "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"

const NAV_LINKS = [
  { to: "/explorar", label: "Explorar" },
  { to: "/horario", label: "Mi horario" },
  { to: "/historia", label: "Mi historia académica" },
  { to: "/perfil", label: "Mi perfil" },
]

export default function NavBar() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const authButton = !isLoading &&
    (isAuthenticated ? (
      <button
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Salir{user?.given_name ? ` (${user.given_name})` : ""}
      </button>
    ) : (
      <button
        onClick={() => loginWithRedirect()}
        className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
      >
        Iniciar sesión
      </button>
    ))

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Chronos
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </Link>
          ))}
          <a href="https://github.com/kblandonv/chronos" target="_blank" rel="noreferrer" className={linkClass}>
            GitHub
          </a>
          {authButton}
        </nav>

        <button
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuAbierto ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuAbierto && (
        <nav className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm font-medium dark:border-slate-800 md:hidden">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass} onClick={() => setMenuAbierto(false)}>
              {l.label}
            </Link>
          ))}
          <a href="https://github.com/kblandonv/chronos" target="_blank" rel="noreferrer" className={linkClass}>
            GitHub
          </a>
          <div className="pt-1">{authButton}</div>
        </nav>
      )}
    </header>
  )
}

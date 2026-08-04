export default function Footer() {
  return (
    <footer className="border-t border-slate-200 px-6 py-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Chronos guarda tu horario y, si inicias sesión, tu historia académica para que no la pierdas entre
          dispositivos. No compartimos esos datos con nadie más.
        </p>
        <a
          href="https://github.com/kblandonv/chronos"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-violet-600 hover:underline dark:text-violet-400"
        >
          Código abierto en GitHub
        </a>
      </div>
    </footer>
  )
}

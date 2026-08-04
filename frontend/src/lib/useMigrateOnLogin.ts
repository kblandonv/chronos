import { useAuth0 } from "@auth0/auth0-react"
import { useEffect, useRef } from "react"
import { localHorario, localPlanes } from "./localStore"
import { useApi } from "./useApi"

/**
 * Registration is optional -- people can build a schedule anonymously first
 * and decide to log in later. When they do, push whatever was sitting in
 * localStorage into their new account (best effort; a conflict or duplicate
 * just gets skipped) and clear it so it doesn't linger as orphaned state.
 */
export function useMigrateOnLogin() {
  const { isAuthenticated, isLoading } = useAuth0()
  const apiMe = useApi()
  const done = useRef(false)

  useEffect(() => {
    if (isLoading || !isAuthenticated || done.current) return
    done.current = true

    const grupos = localHorario.list()
    const planes = localPlanes.list()
    if (grupos.length === 0 && planes.length === 0) return

    void (async () => {
      for (const g of grupos) {
        try {
          await apiMe.agregarGrupo(g.id)
        } catch {
          // conflict or already added elsewhere -- best effort, skip it
        }
      }
      for (const p of planes) {
        try {
          await apiMe.agregarPlan(p.id)
        } catch {
          // ignore
        }
      }
      localHorario.clear()
      localPlanes.clear()
    })()
  }, [isAuthenticated, isLoading, apiMe])
}

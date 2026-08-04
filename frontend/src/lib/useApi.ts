import { useAuth0 } from "@auth0/auth0-react"
import { useCallback } from "react"
import { api } from "./api"

/** Wraps the protected /me/* calls with a fresh Auth0 access token. */
export function useApi() {
  const { getAccessTokenSilently } = useAuth0()

  const withToken = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      const token = await getAccessTokenSilently()
      return fn(token)
    },
    [getAccessTokenSilently],
  )

  return {
    me: () => withToken(api.me),
    horario: () => withToken(api.horario),
    agregarGrupo: (grupoId: number) => withToken((t) => api.agregarGrupo(t, grupoId)),
    quitarGrupo: (grupoId: number) => withToken((t) => api.quitarGrupo(t, grupoId)),
    misPlanes: () => withToken(api.misPlanes),
    agregarPlan: (planId: number) => withToken((t) => api.agregarPlan(t, planId)),
    quitarPlan: (planId: number) => withToken((t) => api.quitarPlan(t, planId)),
  }
}

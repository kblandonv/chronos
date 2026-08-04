import { useAuth0 } from "@auth0/auth0-react"
import { useCallback } from "react"
import { api } from "./api"
import { localHistoria } from "./localStore"
import type { HistoriaAcademica } from "./types"
import { useApi } from "./useApi"

/**
 * Same optional-login shape as horario/planes: without a session the raw
 * pasted text is the thing kept in localStorage (not the parsed result),
 * so logging in later can migrate it with the exact same PUT call used
 * for a fresh paste.
 */
export function useHistoriaStore() {
  const { isAuthenticated } = useAuth0()
  const apiMe = useApi()

  const obtener = useCallback(async (): Promise<HistoriaAcademica | null> => {
    if (isAuthenticated) {
      try {
        return await apiMe.miHistoria()
      } catch {
        return null
      }
    }
    const raw = localHistoria.getRaw()
    return raw ? api.parseHistoria(raw) : null
  }, [isAuthenticated, apiMe])

  const guardar = useCallback(
    async (text: string): Promise<HistoriaAcademica> => {
      if (isAuthenticated) return apiMe.guardarHistoria(text)
      localHistoria.setRaw(text)
      return api.parseHistoria(text)
    },
    [isAuthenticated, apiMe],
  )

  return { obtener, guardar }
}

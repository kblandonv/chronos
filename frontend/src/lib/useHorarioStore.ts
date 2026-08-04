import { useAuth0 } from "@auth0/auth0-react"
import { useCallback } from "react"
import { ApiError } from "./api"
import { localHorario, seCruzan } from "./localStore"
import type { Grupo } from "./types"
import { useApi } from "./useApi"

/**
 * Registration is optional: without login, the schedule lives in
 * localStorage only (this browser, this device). Logging in switches to
 * the backend, which is the only way to keep it across devices.
 */
export function useHorarioStore() {
  const { isAuthenticated } = useAuth0()
  const apiMe = useApi()

  const listar = useCallback((): Promise<Grupo[]> => {
    return isAuthenticated ? apiMe.horario() : Promise.resolve(localHorario.list())
  }, [isAuthenticated, apiMe])

  const agregar = useCallback(
    async (grupo: Grupo): Promise<Grupo> => {
      if (isAuthenticated) return apiMe.agregarGrupo(grupo.id)

      const conflicto = localHorario.list().find((g) => seCruzan(g, grupo))
      if (conflicto) {
        throw new ApiError(409, {
          message: `Cruza con ${conflicto.asignatura_nombre ?? "otra asignatura"} (Grupo ${conflicto.numero}).`,
        })
      }
      localHorario.add(grupo)
      return grupo
    },
    [isAuthenticated, apiMe],
  )

  const quitar = useCallback(
    (grupoId: number): Promise<void> => {
      if (isAuthenticated) return apiMe.quitarGrupo(grupoId)
      localHorario.remove(grupoId)
      return Promise.resolve()
    },
    [isAuthenticated, apiMe],
  )

  return { listar, agregar, quitar }
}

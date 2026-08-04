import { useAuth0 } from "@auth0/auth0-react"
import { useCallback } from "react"
import { localPlanes } from "./localStore"
import type { Plan } from "./types"
import { useApi } from "./useApi"

export function usePlanesStore() {
  const { isAuthenticated } = useAuth0()
  const apiMe = useApi()

  const listar = useCallback((): Promise<Plan[]> => {
    return isAuthenticated ? apiMe.misPlanes() : Promise.resolve(localPlanes.list())
  }, [isAuthenticated, apiMe])

  const agregar = useCallback(
    (plan: Plan): Promise<Plan> => {
      if (isAuthenticated) return apiMe.agregarPlan(plan.id)
      localPlanes.add(plan)
      return Promise.resolve(plan)
    },
    [isAuthenticated, apiMe],
  )

  const quitar = useCallback(
    (planId: number): Promise<void> => {
      if (isAuthenticated) return apiMe.quitarPlan(planId)
      localPlanes.remove(planId)
      return Promise.resolve()
    },
    [isAuthenticated, apiMe],
  )

  return { listar, agregar, quitar }
}

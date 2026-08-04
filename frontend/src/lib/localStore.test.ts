import { describe, expect, it } from "vitest"
import { seCruzan } from "./localStore"
import type { Grupo } from "./types"

function grupo(id: number, horarios: Array<[string, string, string]>): Grupo {
  return {
    id,
    asignatura_id: id,
    asignatura_codigo: null,
    asignatura_nombre: `Asignatura ${id}`,
    numero: 1,
    profesor: null,
    jornada: null,
    cupos_disponibles: null,
    fecha_inicio: null,
    fecha_fin: null,
    horarios: horarios.map(([dia, hora_inicio, hora_fin]) => ({ dia, hora_inicio, hora_fin, aula: null })),
  }
}

describe("seCruzan", () => {
  it("detects overlapping times on the same day", () => {
    const a = grupo(1, [["LUNES", "08:00", "10:00"]])
    const b = grupo(2, [["LUNES", "09:00", "11:00"]])
    expect(seCruzan(a, b)).toBe(true)
  })

  it("does not flag back-to-back groups on the same day", () => {
    const a = grupo(1, [["LUNES", "08:00", "10:00"]])
    const b = grupo(2, [["LUNES", "10:00", "12:00"]])
    expect(seCruzan(a, b)).toBe(false)
  })

  it("does not flag identical times on different days", () => {
    const a = grupo(1, [["LUNES", "08:00", "10:00"]])
    const b = grupo(2, [["MARTES", "08:00", "10:00"]])
    expect(seCruzan(a, b)).toBe(false)
  })

  it("detects an overlap when one range fully contains the other", () => {
    const a = grupo(1, [["MIERCOLES", "07:00", "12:00"]])
    const b = grupo(2, [["MIERCOLES", "09:00", "10:00"]])
    expect(seCruzan(a, b)).toBe(true)
  })

  it("detects identical time ranges as a conflict", () => {
    const a = grupo(1, [["VIERNES", "13:00", "15:00"]])
    const b = grupo(2, [["VIERNES", "13:00", "15:00"]])
    expect(seCruzan(a, b)).toBe(true)
  })

  it("checks every combination when a grupo meets on multiple days", () => {
    const a = grupo(1, [
      ["LUNES", "08:00", "10:00"],
      ["SABADO", "07:00", "09:00"],
    ])
    const b = grupo(2, [["SABADO", "08:00", "10:00"]])
    expect(seCruzan(a, b)).toBe(true)
  })

  it("returns false when no day matches at all", () => {
    const a = grupo(1, [["LUNES", "08:00", "10:00"]])
    const b = grupo(2, [["DOMINGO", "13:00", "14:00"]])
    expect(seCruzan(a, b)).toBe(false)
  })
})

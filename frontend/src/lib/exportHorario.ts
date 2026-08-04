import { DIA_LABELS } from "./types"
import type { Grupo } from "./types"

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** xlsx is a ~300kB dependency used only when someone actually clicks
 * "Exportar a Excel", so it's loaded on demand instead of in the main
 * bundle. */
export async function exportToExcel(grupos: Grupo[]) {
  const XLSX = await import("xlsx")
  const filas = grupos.flatMap((g) =>
    g.horarios.map((h) => ({
      Asignatura: g.asignatura_nombre ?? "",
      Código: g.asignatura_codigo ?? "",
      Grupo: g.numero,
      Profesor: g.profesor ?? "",
      Día: DIA_LABELS[h.dia] ?? h.dia,
      "Hora inicio": h.hora_inicio.slice(0, 5),
      "Hora fin": h.hora_fin.slice(0, 5),
      Aula: h.aula ?? "",
      "Cupos disponibles": g.cupos_disponibles ?? "",
      Jornada: g.jornada ?? "",
    })),
  )
  const hoja = XLSX.utils.json_to_sheet(filas)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, "Horario")
  XLSX.writeFile(libro, "horario-chronos.xlsx")
}

const DIA_A_NUMERO: Record<string, number> = {
  DOMINGO: 0,
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
}

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

function fechaICS(fecha: Date, horas: number, minutos: number) {
  return `${fecha.getFullYear()}${pad(fecha.getMonth() + 1)}${pad(fecha.getDate())}T${pad(horas)}${pad(minutos)}00`
}

function primeraOcurrencia(desde: Date, diaSemana: number): Date {
  const d = new Date(desde)
  while (d.getDay() !== diaSemana) d.setDate(d.getDate() + 1)
  return d
}

function escapeICS(texto: string) {
  return texto.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n")
}

/** A .ics import (not a live Google Calendar API integration -- that needs
 * OAuth credentials we don't have) covers every calendar app in one file,
 * including Google Calendar via Settings > Import & Export. */
export function exportToICS(grupos: Grupo[]) {
  const lineas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Chronos//Horario//ES", "CALSCALE:GREGORIAN"]

  for (const g of grupos) {
    if (!g.fecha_inicio || !g.fecha_fin) continue
    const inicio = new Date(`${g.fecha_inicio}T00:00:00`)
    const fin = new Date(`${g.fecha_fin}T00:00:00`)

    for (const h of g.horarios) {
      const diaSemana = DIA_A_NUMERO[h.dia]
      if (diaSemana == null) continue

      const primerDia = primeraOcurrencia(inicio, diaSemana)
      const [horaIni, minIni] = h.hora_inicio.split(":").map(Number)
      const [horaFin, minFin] = h.hora_fin.split(":").map(Number)
      const until = `${fin.getFullYear()}${pad(fin.getMonth() + 1)}${pad(fin.getDate())}T235959`

      lineas.push(
        "BEGIN:VEVENT",
        `UID:${g.id}-${h.dia}@chronos.app`,
        `DTSTART:${fechaICS(primerDia, horaIni, minIni)}`,
        `DTEND:${fechaICS(primerDia, horaFin, minFin)}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${until}`,
        `SUMMARY:${escapeICS(`${g.asignatura_nombre ?? "Asignatura"} (Grupo ${g.numero})`)}`,
        `DESCRIPTION:${escapeICS(`Profesor: ${g.profesor ?? "No informado"}\nCupos disponibles: ${g.cupos_disponibles ?? "?"}`)}`,
        ...(h.aula ? [`LOCATION:${escapeICS(h.aula)}`] : []),
        "END:VEVENT",
      )
    }
  }

  lineas.push("END:VCALENDAR")
  downloadBlob(lineas.join("\r\n"), "horario-chronos.ics", "text/calendar")
}

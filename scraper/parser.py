"""
Parses the "Grupo" detail blocks (professor, schedule, room, capacity) out
of the BeautifulSoup returned by SiaClient.expand_asignatura().

See scraper/fixtures/detalle_asignatura.html for a real captured example.
Each subject can have several groups; each group can meet on more than one
day, so the schedule ("Horarios/Aula") text is parsed with a regex that
finds every "DIA de HH:MM a HH:MM" occurrence rather than assuming just one.
"""
import re

HORARIO_RE = re.compile(
    r"([A-ZÁÉÍÓÚÑ]+)\s+de\s+(\d{2}:\d{2})\s+a\s+(\d{2}:\d{2})"
)

DIAS_VALIDOS = {
    "LUNES", "MARTES", "MIERCOLES", "MIÉRCOLES", "JUEVES",
    "VIERNES", "SABADO", "SÁBADO", "DOMINGO",
}


def _text(el):
    return el.get_text(" ", strip=True) if el else None


def parse_grupos(soup):
    """soup is the full page BeautifulSoup after expanding an asignatura."""
    grupos = []
    for header in soup.select("h2.af_showDetailHeader_title-text0"):
        title = header.get_text(strip=True)
        m = re.match(r"\((\d+)\)\s*Grupo\s*(\d+)", title)
        if not m:
            continue
        numero = int(m.group(2))

        content_id = header.find_parent(id=re.compile(r".*::_afrTtxt$"))
        if content_id is None:
            continue
        sdh_id = content_id["id"].rsplit("::", 1)[0]
        content = soup.find(id=f"{sdh_id}::content")
        if content is None:
            continue

        profesor = None
        prof_label = content.find(string=re.compile(r"Profesor:"))
        if prof_label:
            strong = prof_label.find_parent("span").find("span", class_="strong")
            profesor = _text(strong)

        jornada = None
        jornada_label = content.find(string=re.compile(r"Jornada:"))
        if jornada_label:
            jornada = jornada_label.find_next("span").get_text(strip=True)

        cupos = None
        cupos_label = content.find(string=re.compile(r"Cupos disponibles:"))
        if cupos_label:
            raw = cupos_label.find_next("span").get_text(strip=True)
            cupos = int(raw) if raw.isdigit() else None

        fecha_inicio = fecha_fin = None
        fecha_label = content.find(string=re.compile(r"^Fecha:$"))
        if fecha_label:
            spans = fecha_label.find_parent("span").find_all("span")
            dates = [_text(s) for s in spans if re.match(r"\d{2}/\d{2}/\d{4}", _text(s) or "")]
            if len(dates) >= 2:
                fecha_inicio, fecha_fin = dates[0], dates[1]

        horario_block = content.find(string=re.compile(r"Horarios/Aula"))
        full_text = horario_block.find_parent("span").get_text(" ", strip=True) if horario_block else ""
        horarios = [
            {"dia": dia, "hora_inicio": inicio, "hora_fin": fin}
            for dia, inicio, fin in HORARIO_RE.findall(full_text)
        ]

        grupos.append(
            {
                "numero": numero,
                "profesor": profesor,
                "jornada": jornada,
                "cupos_disponibles": cupos,
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin,
                "horarios": horarios,
            }
        )
    return grupos

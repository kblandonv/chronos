"""
Parses the "Grupo" detail blocks (professor, schedule, room, capacity) out
of the BeautifulSoup returned by SiaClient.expand_asignatura().

See scraper/fixtures/detalle_asignatura.html for a real captured example.
Each subject can have several groups, and each group can meet on more than
one day -- with a *different room* per day in principle, since the aula
breadcrumb is nested inside each individual day/time span, not the group.
Structure (see CLAUDE.md for the annotated version):

    <span class="lista-elemento">          <!-- one weekly occurrence -->
      <span>DOMINGO de 13:00 a 14:00.</span>
      <span class="lista-elemento">        <!-- nested: the room breadcrumb -->
        <span>Cursos Dirigidos o virtuales de la Sede.</span>
        <span>Virtual-4.</span>
        <span>Aulas virtuales.</span>
        <span>SALA DE INFORMATICA O DE COMPUTO.</span>
      </span>
    </span>

Only validated against "Virtual" groups so far -- an in-person room's
breadcrumb text hasn't been seen yet, though the structure should hold.
"""
import re

HORARIO_RE = re.compile(
    r"([A-ZÁÉÍÓÚÑ]+)\s+de\s+(\d{2}:\d{2})\s+a\s+(\d{2}:\d{2})"
)

DIAS_VALIDOS = {"LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"}

_TRADUCTOR_TILDES = str.maketrans("ÁÉÍÓÚÑ", "AEIOUN")


def _normalizar_dia(dia):
    """SIA renders some day names with tildes (MIÉRCOLES, SÁBADO) and others
    without -- strip them so `dia` always matches DIAS_VALIDOS / the frontend's
    day constants, which are all unaccented."""
    return dia.translate(_TRADUCTOR_TILDES)


def _text(el):
    return el.get_text(" ", strip=True) if el else None


def _parse_horarios_con_aula(horario_block):
    if horario_block is None:
        return []

    horarios = []
    for item in horario_block.find_all("span", class_="lista-elemento"):
        # the room breadcrumb is ALSO a "lista-elemento" span, nested inside
        # the day/time one -- skip it here, it gets picked up as `aula`
        # when we process its parent below.
        if item.find_parent("span", class_="lista-elemento") is not None:
            continue

        direct_spans = item.find_all("span", recursive=False)
        if not direct_spans:
            continue
        m = HORARIO_RE.match(direct_spans[0].get_text(strip=True))
        if not m:
            continue

        aula_span = item.find("span", class_="lista-elemento")
        horarios.append(
            {
                "dia": _normalizar_dia(m.group(1)),
                "hora_inicio": m.group(2),
                "hora_fin": m.group(3),
                "aula": _text(aula_span),
            }
        )
    return horarios


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

        horario_label = content.find(string=re.compile(r"Horarios/Aula"))
        horario_block = horario_label.find_parent("span") if horario_label else None
        horarios = _parse_horarios_con_aula(horario_block)

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

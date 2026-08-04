"""
Parses whatever a student gets from doing Select All + Copy on SIA's
"Historia Academica" page and pasting it in. It's not structured data --
just whatever text the browser hands over, tab-separated within a line,
each asignatura's status on the line right after it. See the regexes below
for the shape; there's no fixture for it in the repo since a real paste is
a student's actual transcript (grades included).
"""
import re
from typing import Optional

ASIGNATURA_RE = re.compile(
    r"(?P<nombre>[^\t\n]+?)\s*\((?P<codigo>[\w-]+)\)\t"
    r"(?P<creditos>\d+)\t"
    r"(?P<tipo>[^\t\n]+)\t"
    r"(?P<periodo>\d{4}-\d[A-Za-z]?)\s+(?P<modalidad>[^\t\n]+)\t"
    r"(?P<calificacion>[\d.,]*)\n"
    r"(?P<estado>APROBADA|REPROBADA|CANCELADA|INSCRITA|EN CURSO|EQUIVALENTE|HOMOLOGADA)"
)

PLAN_RE = re.compile(r"Plan de estudios\s*\n+\s*(?P<codigo>\d+)\s+(?P<nombre>[^\n]+)")
FACULTAD_RE = re.compile(r"Facultad:\s*([^\n]+)")
AVANCE_RE = re.compile(r"Porcentaje de Avance\s*([\d]+(?:[.,]\d+)?)\s*%")
PROMEDIO_RE = re.compile(r"([\d.,]+)\s*\(Acumulado\)\s*\n\s*Pregrado - Promedio acad", re.IGNORECASE)
PAPA_RE = re.compile(r"([\d.,]+)\s*\(Acumulado\)\s*\n\s*Pregrado - P\.A\.P\.A", re.IGNORECASE)

RESUMEN_RE = re.compile(
    r"^(?P<tipologia>[A-ZÁÉÍÓÚÑ. ]+?)\t(?P<exigidos>\d+)\t(?P<aprobados>\d+)\t"
    r"(?P<pendientes>\d+)\t(?P<inscritos>\d+)\t(?P<cursados>\d+)$",
    re.MULTILINE,
)


def _to_float(raw: Optional[str]) -> Optional[float]:
    if raw is None:
        return None
    raw = raw.strip().replace(",", ".")
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def parse_historia(text: str) -> dict:
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    plan_match = PLAN_RE.search(text)
    facultad_match = FACULTAD_RE.search(text)
    avance_match = AVANCE_RE.search(text)
    promedio_match = PROMEDIO_RE.search(text)
    papa_match = PAPA_RE.search(text)

    asignaturas = [
        {
            "nombre": m.group("nombre").strip(),
            "codigo": m.group("codigo").strip(),
            "creditos": int(m.group("creditos")),
            "tipo": m.group("tipo").strip(),
            "periodo": m.group("periodo").strip(),
            "modalidad": m.group("modalidad").strip(),
            "calificacion": _to_float(m.group("calificacion")),
            "estado": m.group("estado").strip(),
        }
        for m in ASIGNATURA_RE.finditer(text)
    ]

    resumen_creditos = [
        {
            "tipologia": m.group("tipologia").strip(),
            "exigidos": int(m.group("exigidos")),
            "aprobados": int(m.group("aprobados")),
            "pendientes": int(m.group("pendientes")),
            "inscritos": int(m.group("inscritos")),
            "cursados": int(m.group("cursados")),
        }
        for m in RESUMEN_RE.finditer(text)
    ]

    return {
        "plan_codigo": plan_match.group("codigo") if plan_match else None,
        "plan_nombre": plan_match.group("nombre").strip() if plan_match else None,
        "facultad": facultad_match.group(1).strip() if facultad_match else None,
        "porcentaje_avance": _to_float(avance_match.group(1)) if avance_match else None,
        "promedio_acumulado": _to_float(promedio_match.group(1)) if promedio_match else None,
        "papa_acumulado": _to_float(papa_match.group(1)) if papa_match else None,
        "asignaturas": asignaturas,
        "resumen_creditos": resumen_creditos,
    }

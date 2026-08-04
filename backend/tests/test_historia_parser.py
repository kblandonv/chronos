"""
Tests for historia_parser against synthetic text built to match the exact
shape SIA's "Historia Academica" page yields on a Select All + Copy (see
the regexes in app/historia_parser.py). There's no real fixture here since
a genuine paste is someone's actual transcript with grades in it.
"""
from app.historia_parser import parse_historia

SAMPLE = (
    "Facultad: FACULTAD DE MINAS\n"
    "Plan de estudios\n"
    "\n"
    "3577 INGENIERÍA DE SISTEMAS Y COMPUTACIÓN\n"
    "\n"
    "Porcentaje de Avance 81.9 %\n"
    "\n"
    "3.8 (Acumulado)\n"
    "Pregrado - Promedio académico\n"
    "\n"
    "3.6 (Acumulado)\n"
    "Pregrado - P.A.P.A\n"
    "\n"
    "FUNDAMENTACION\t40\t36\t4\t0\t36\n"
    "DISCIPLINAR OBLIGATORIA\t60\t50\t10\t3\t53\n"
    "\n"
    "CÁLCULO DIFERENCIAL (1000003)\t4\tFundamentación\t2023-1 Presencial\t4.5\n"
    "APROBADA\n"
    "PROGRAMACIÓN ORIENTADA A OBJETOS (3007321)\t3\tDisciplinar\t2024-1 Presencial\t\n"
    "EN CURSO\n"
)


def test_parses_plan_and_facultad():
    result = parse_historia(SAMPLE)
    assert result["plan_codigo"] == "3577"
    assert result["plan_nombre"] == "INGENIERÍA DE SISTEMAS Y COMPUTACIÓN"
    assert result["facultad"] == "FACULTAD DE MINAS"


def test_parses_avance_promedio_and_papa():
    result = parse_historia(SAMPLE)
    assert result["porcentaje_avance"] == 81.9
    assert result["promedio_acumulado"] == 3.8
    assert result["papa_acumulado"] == 3.6


def test_parses_resumen_creditos_rows():
    result = parse_historia(SAMPLE)
    assert len(result["resumen_creditos"]) == 2
    fundamentacion = result["resumen_creditos"][0]
    assert fundamentacion == {
        "tipologia": "FUNDAMENTACION",
        "exigidos": 40,
        "aprobados": 36,
        "pendientes": 4,
        "inscritos": 0,
        "cursados": 36,
    }


def test_parses_asignaturas_with_grade_and_without():
    result = parse_historia(SAMPLE)
    assert len(result["asignaturas"]) == 2

    aprobada = result["asignaturas"][0]
    assert aprobada["nombre"] == "CÁLCULO DIFERENCIAL"
    assert aprobada["codigo"] == "1000003"
    assert aprobada["creditos"] == 4
    assert aprobada["periodo"] == "2023-1"
    assert aprobada["calificacion"] == 4.5
    assert aprobada["estado"] == "APROBADA"

    en_curso = result["asignaturas"][1]
    assert en_curso["nombre"] == "PROGRAMACIÓN ORIENTADA A OBJETOS"
    assert en_curso["calificacion"] is None
    assert en_curso["estado"] == "EN CURSO"


def test_handles_crlf_line_endings():
    crlf_sample = SAMPLE.replace("\n", "\r\n")
    result = parse_historia(crlf_sample)
    assert result["plan_codigo"] == "3577"
    assert len(result["asignaturas"]) == 2


def test_missing_sections_return_none_instead_of_raising():
    result = parse_historia("no coincide con nada de lo esperado")
    assert result["plan_codigo"] is None
    assert result["plan_nombre"] is None
    assert result["facultad"] is None
    assert result["porcentaje_avance"] is None
    assert result["promedio_acumulado"] is None
    assert result["papa_acumulado"] is None
    assert result["asignaturas"] == []
    assert result["resumen_creditos"] == []


def test_comma_decimal_separator_is_normalized():
    text = SAMPLE.replace("81.9", "81,9").replace("3.8", "3,8").replace("3.6", "3,6")
    result = parse_historia(text)
    assert result["porcentaje_avance"] == 81.9
    assert result["promedio_acumulado"] == 3.8
    assert result["papa_acumulado"] == 3.6

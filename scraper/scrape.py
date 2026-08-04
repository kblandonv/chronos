"""
Scrapes every asignatura + grupo (schedule) for a single plan de estudios
and persists it to Postgres.

This is a first, manually-targeted pass -- it does not yet crawl every
facultad/plan combination for all three niveles de estudio. See CLAUDE.md
for what's still missing before this can run unattended over the full
catalog.
"""
import logging
import sys

from playwright.sync_api import sync_playwright

from config import NIVELES, SEDES
from db import get_session
from parser import parse_grupos
from persist import link_asignatura_plan, upsert_asignatura, upsert_facultad, upsert_plan, replace_grupos
from sia_client import SiaClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("scrape")


def find_option(options, query):
    match = next((o for o in options if query.upper() in o["text"].upper()), None)
    if match is None:
        raise ValueError(f"no option matches {query!r} among {[o['text'] for o in options]}")
    return match


def scrape_plan(nivel_key, facultad_query, plan_query, sede_key="medellin"):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        client = SiaClient(page)
        client.open()

        client.select_nivel(NIVELES[nivel_key])
        client.select_sede(SEDES[sede_key])

        facultades = client.list_facultades()
        facultad_opt = find_option(facultades, facultad_query)
        client.select_facultad(facultad_opt["value"])
        log.info("facultad: %s", facultad_opt["text"])

        planes = client.list_planes()
        plan_opt = find_option(planes, plan_query)
        client.select_plan(plan_opt["value"])
        log.info("plan de estudios: %s", plan_opt["text"])

        client.click_mostrar()
        rows = client.list_asignaturas()
        log.info("asignaturas encontradas: %d", len(rows))

        # Expanding a row and going "Volver" makes ADF re-render the whole
        # results table with fresh DOM ids, so a link_id captured before
        # expanding the *previous* row is stale by the time we get to this
        # one. Re-list after every expansion and match by codigo instead.
        pendientes = {row["codigo"] for row in rows}

        with get_session() as session:
            facultad = upsert_facultad(session, facultad_opt["text"], sede_key)
            plan = upsert_plan(session, plan_opt["text"], nivel_key, facultad.id)
            session.commit()

            for row in rows:
                asignatura = upsert_asignatura(session, row, sede_key)
                link_asignatura_plan(session, asignatura.id, plan.id)
                session.commit()

            while pendientes:
                current_rows = {r["codigo"]: r for r in client.list_asignaturas()}
                codigo = next(iter(pendientes))
                row = current_rows[codigo]

                detail = client.expand_asignatura(row["link_id"])
                grupos = parse_grupos(detail)
                asignatura = upsert_asignatura(session, row, sede_key)
                replace_grupos(session, asignatura.id, grupos)
                session.commit()
                log.info("  %s (%s): %d grupos", asignatura.codigo, asignatura.nombre, len(grupos))
                pendientes.discard(codigo)

        browser.close()


if __name__ == "__main__":
    scrape_plan("doctorado", "MINAS", "SISTEMAS E INFORM")

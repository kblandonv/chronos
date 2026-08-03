"""
Crawls every facultad and plan de estudios, for every nivel de estudio, at
Sede Medellin, and persists everything found. This is the unattended,
full-catalog version of what scrape.py demonstrates for a single plan.

Each plan is scraped and committed independently and failures are caught
and logged rather than aborting the whole run, since a single malformed
plan/asignatura shouldn't take down a multi-hour crawl.
"""
import logging
import sys
import time

from playwright.sync_api import sync_playwright

from config import NIVELES
from db import get_session
from parser import parse_grupos
from persist import link_asignatura_plan, replace_grupos, upsert_asignatura, upsert_facultad, upsert_plan
from sia_client import SiaClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("crawl")


def scrape_current_plan(client, session, nivel_key, facultad_opt, plan_opt):
    client.click_mostrar()
    rows = client.list_asignaturas()

    facultad = upsert_facultad(session, facultad_opt["text"])
    plan = upsert_plan(session, plan_opt["text"], nivel_key, facultad.id)
    session.commit()

    for row in rows:
        asignatura = upsert_asignatura(session, row)
        link_asignatura_plan(session, asignatura.id, plan.id)
        session.commit()

    pendientes = {row["codigo"] for row in rows}
    grupos_totales = 0
    while pendientes:
        current_rows = {r["codigo"]: r for r in client.list_asignaturas()}
        codigo = next(iter(pendientes))
        row = current_rows[codigo]

        detail = client.expand_asignatura(row["link_id"])
        grupos = parse_grupos(detail)
        asignatura = upsert_asignatura(session, row)
        replace_grupos(session, asignatura.id, grupos)
        session.commit()
        grupos_totales += len(grupos)
        pendientes.discard(codigo)

    return len(rows), grupos_totales


def crawl():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for nivel_key, nivel_value in NIVELES.items():
            page = browser.new_page()
            client = SiaClient(page)
            client.open()
            client.select_nivel(nivel_value)

            facultades = client.list_facultades()
            log.info("=== nivel=%s: %d facultades ===", nivel_key, len(facultades))

            for fi, facultad_opt in enumerate(facultades, start=1):
                client.select_facultad(facultad_opt["value"])
                planes = client.list_planes()
                log.info(
                    "[%s] facultad %d/%d: %s (%d planes)",
                    nivel_key, fi, len(facultades), facultad_opt["text"], len(planes),
                )

                for pi, plan_opt in enumerate(planes, start=1):
                    t0 = time.monotonic()
                    try:
                        client.select_plan(plan_opt["value"])
                        with get_session() as session:
                            n_asig, n_grupos = scrape_current_plan(
                                client, session, nivel_key, facultad_opt, plan_opt
                            )
                        log.info(
                            "  [%s] plan %d/%d: %s -> %d asignaturas, %d grupos (%.1fs)",
                            nivel_key, pi, len(planes), plan_opt["text"],
                            n_asig, n_grupos, time.monotonic() - t0,
                        )
                    except Exception:
                        log.exception(
                            "  [%s] FAILED plan %s (facultad %s)",
                            nivel_key, plan_opt["text"], facultad_opt["text"],
                        )
                        # the page may be left in a broken state after an
                        # unexpected error -- reload and re-select down to
                        # this facultad before trying the next plan.
                        client.open()
                        client.select_nivel(nivel_value)
                        client.select_facultad(facultad_opt["value"])

            page.close()

        browser.close()


if __name__ == "__main__":
    crawl()

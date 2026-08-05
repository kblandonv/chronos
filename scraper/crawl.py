"""
Crawls every sede, every nivel de estudio, every facultad, and every plan de
estudios, persisting everything found. This is the unattended, full-catalog
version of what scrape.py demonstrates for a single plan.

Each plan is scraped and committed independently and failures are caught
and logged rather than aborting the whole run, since a single malformed
plan/asignatura shouldn't take down a run that can take many hours.
"""
import logging
import time

from playwright.sync_api import sync_playwright

from config import NIVELES, SEDES
from db import get_session
from parser import parse_grupos
from persist import link_asignatura_plan, replace_grupos, upsert_asignatura, upsert_facultad, upsert_plan
from sia_client import SiaClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("crawl")


def scrape_current_plan(client, session, sede_key, nivel_key, facultad_opt, plan_opt):
    client.click_mostrar()
    rows = client.list_asignaturas()

    facultad = upsert_facultad(session, facultad_opt["text"], sede_key)
    plan = upsert_plan(session, plan_opt["text"], nivel_key, facultad.id)
    session.commit()

    for row in rows:
        asignatura = upsert_asignatura(session, row, sede_key)
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
        asignatura = upsert_asignatura(session, row, sede_key)
        replace_grupos(session, asignatura.id, grupos)
        session.commit()
        grupos_totales += len(grupos)
        pendientes.discard(codigo)

    return len(rows), grupos_totales


def crawl(sede_keys=None, nivel_keys=None):
    sede_keys = sede_keys or list(SEDES.keys())
    nivel_keys = nivel_keys or list(NIVELES.keys())

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for sede_key in sede_keys:
            sede_value = SEDES[sede_key]

            for nivel_key in nivel_keys:
                nivel_value = NIVELES[nivel_key]
                page = browser.new_page()
                client = SiaClient(page)

                try:
                    client.open()
                    client.select_nivel(nivel_value)
                    client.select_sede(sede_value)
                    facultades = client.list_facultades()
                except Exception:
                    log.exception(
                        "FAILED to set up sede=%s nivel=%s, retrying once", sede_key, nivel_key
                    )
                    try:
                        page.close()
                    except Exception:
                        pass
                    page = browser.new_page()
                    client = SiaClient(page)
                    try:
                        client.open()
                        client.select_nivel(nivel_value)
                        client.select_sede(sede_value)
                        facultades = client.list_facultades()
                    except Exception:
                        log.exception(
                            "FAILED AGAIN to set up sede=%s nivel=%s, skipping it entirely",
                            sede_key, nivel_key,
                        )
                        page.close()
                        continue

                log.info("=== sede=%s nivel=%s: %d facultades ===", sede_key, nivel_key, len(facultades))

                for fi, facultad_opt in enumerate(facultades, start=1):
                    client.select_facultad(facultad_opt["value"])
                    planes = client.list_planes()
                    log.info(
                        "[%s/%s] facultad %d/%d: %s (%d planes)",
                        sede_key, nivel_key, fi, len(facultades), facultad_opt["text"], len(planes),
                    )

                    for pi, plan_opt in enumerate(planes, start=1):
                        t0 = time.monotonic()
                        try:
                            client.select_plan(plan_opt["value"])
                            with get_session() as session:
                                n_asig, n_grupos = scrape_current_plan(
                                    client, session, sede_key, nivel_key, facultad_opt, plan_opt
                                )
                            log.info(
                                "  [%s/%s] plan %d/%d: %s -> %d asignaturas, %d grupos (%.1fs)",
                                sede_key, nivel_key, pi, len(planes), plan_opt["text"],
                                n_asig, n_grupos, time.monotonic() - t0,
                            )
                        except Exception:
                            log.exception(
                                "  [%s/%s] FAILED plan %s (facultad %s)",
                                sede_key, nivel_key, plan_opt["text"], facultad_opt["text"],
                            )
                            # the page may be left in a broken state after an
                            # unexpected error -- reload and re-descend to
                            # this facultad before trying the next plan. This
                            # recovery can itself hang/fail (a wedged page),
                            # which used to propagate uncaught and kill the
                            # whole multi-hour run -- retry once with a fresh
                            # page, and if that also fails, give up on just
                            # this facultad's remaining plans instead.
                            try:
                                client.open()
                                client.select_nivel(nivel_value)
                                client.select_sede(sede_value)
                                client.select_facultad(facultad_opt["value"])
                            except Exception:
                                log.exception(
                                    "  [%s/%s] FAILED to recover after plan %s, retrying with a fresh page",
                                    sede_key, nivel_key, plan_opt["text"],
                                )
                                try:
                                    page.close()
                                except Exception:
                                    pass
                                page = browser.new_page()
                                client = SiaClient(page)
                                try:
                                    client.open()
                                    client.select_nivel(nivel_value)
                                    client.select_sede(sede_value)
                                    client.select_facultad(facultad_opt["value"])
                                except Exception:
                                    log.exception(
                                        "  [%s/%s] FAILED AGAIN to recover, skipping the rest of facultad %s",
                                        sede_key, nivel_key, facultad_opt["text"],
                                    )
                                    break

                page.close()

        browser.close()


if __name__ == "__main__":
    crawl()

"""
Exploration script: understand the cascading-select behavior of the SIA
"Catalogo de Asignaturas" ADF form for Sede Medellin, across the three
niveles de estudio (Pregrado, Doctorado, Postgrados y masteres).

Not a scraper yet -- just prints out what options become available at
each step so we can map the full cascade before writing the real crawler.
"""
import json
from playwright.sync_api import sync_playwright

URL = "https://sia.unal.edu.co/Catalogo/facespublico/public/servicioPublico.jsf?taskflowId=task-flow-AC_CatalogoAsignaturas"

NIVELES = {"0": "Pregrado", "1": "Doctorado", "2": "Postgrados y masteres"}
SEDE_MEDELLIN_VALUE = "6"  # from elementos2.txt: <option value="6" title="1102 SEDE MEDELLÍN">


def dump_options(page, select_id):
    return page.eval_on_selector_all(
        f"#{select_id} option",
        "els => els.map(e => ({value: e.value, text: e.textContent.trim()}))",
    )


def main():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for nivel_value, nivel_name in NIVELES.items():
            page.goto(URL, wait_until="networkidle")

            nivel_id = "pt1:r1:0:soc1::content"
            sede_id = "pt1:r1:0:soc9::content"
            facultad_id = "pt1:r1:0:soc2::content"
            nivel_select = "pt1\\:r1\\:0\\:soc1\\:\\:content"
            sede_select = "pt1\\:r1\\:0\\:soc9\\:\\:content"
            facultad_select = "pt1\\:r1\\:0\\:soc2\\:\\:content"

            # ADF Faces lazily attaches the 'change' handler to a select only
            # after it receives focus (component "activation"). Skipping this
            # means select_option() silently changes the DOM value with no
            # partial-page-request firing and the cascade never advances.
            page.locator(f"#{nivel_select}").focus()
            page.select_option(f"#{nivel_select}", nivel_value)
            page.wait_for_function(
                "sel => { const el = document.getElementById(sel); return el && !el.disabled; }",
                arg=sede_id,
                timeout=15000,
            )

            sede_options = dump_options(page, sede_select)
            page.locator(f"#{sede_select}").focus()
            page.select_option(f"#{sede_select}", SEDE_MEDELLIN_VALUE)
            page.wait_for_function(
                "sel => { const el = document.getElementById(sel); return el && !el.disabled && el.options.length > 0; }",
                arg=facultad_id,
                timeout=15000,
            )

            facultad_options = dump_options(page, facultad_select)

            results[nivel_name] = {
                "sede_options": sede_options,
                "facultad_options": facultad_options,
            }
            print(f"=== {nivel_name} ===")
            print(f"  sedes: {len(sede_options)} opciones")
            print(f"  facultades tras elegir Medellin: {len(facultad_options)} opciones")
            for o in facultad_options[:10]:
                print("   -", o)

        browser.close()

    with open("explore_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()

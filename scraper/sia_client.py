"""
Playwright driver for the SIA "Catalogo de Asignaturas" form.

This is an Oracle ADF Faces (JSF) page: server-rendered, stateful, with
cascading dependent <select> fields driven by partial-page-request AJAX
calls. Two quirks matter here (see CLAUDE.md for the full writeup):

1. A <select> only attaches its 'change' handler after receiving focus
   (lazy component activation), so every selection is `focus()` then
   `select_option()`.
2. A single user action can trigger more than one chained partial-page
   request. Waiting for just one network-idle window is not enough -- a
   later response can silently reset the value you just set. `_settle()`
   waits until no new requests have fired for a full idle window, and
   `_select()` retries the selection if it got reset.
"""
from bs4 import BeautifulSoup

from config import SIA_CATALOGO_URL

NIVEL_SELECT = "pt1:r1:0:soc1::content"
SEDE_SELECT = "pt1:r1:0:soc9::content"
FACULTAD_SELECT = "pt1:r1:0:soc2::content"
PLAN_SELECT = "pt1:r1:0:soc3::content"
MOSTRAR_BUTTON = "pt1:r1:0:cb1"


def _css_id(raw_id):
    return "#" + raw_id.replace(":", "\\:")


class SiaClient:
    def __init__(self, page):
        self.page = page
        self._requests = []
        page.on("request", lambda r: self._requests.append(r.url))

    def open(self):
        self.page.goto(SIA_CATALOGO_URL, wait_until="networkidle")

    def _settle(self, max_rounds=8):
        for _ in range(max_rounds):
            before = len(self._requests)
            self.page.wait_for_load_state("networkidle", timeout=15000)
            self.page.wait_for_timeout(900)
            if len(self._requests) == before:
                return
        raise RuntimeError("page did not settle after selection")

    def _select(self, raw_id, value, max_attempts=5):
        for _ in range(max_attempts):
            self.page.locator(_css_id(raw_id)).focus()
            self.page.select_option(_css_id(raw_id), value)
            self._settle()
            current = self.page.evaluate(f"document.getElementById('{raw_id}').value")
            if current == value:
                return
        raise RuntimeError(f"could not stabilize {raw_id} to value {value!r}")

    def _options(self, raw_id):
        return self.page.eval_on_selector_all(
            f"{_css_id(raw_id)} option",
            "els => els.map(e => ({value: e.value, text: e.textContent.trim()}))",
        )

    def select_nivel(self, nivel_value):
        self._select(NIVEL_SELECT, nivel_value)

    def select_sede(self, sede_value):
        self._select(SEDE_SELECT, sede_value)

    def list_facultades(self):
        return [o for o in self._options(FACULTAD_SELECT) if o["value"] != ""]

    def select_facultad(self, value):
        self._select(FACULTAD_SELECT, value)

    def list_planes(self):
        return [o for o in self._options(PLAN_SELECT) if o["value"] != ""]

    def select_plan(self, value):
        self._select(PLAN_SELECT, value)

    def click_mostrar(self):
        self.page.wait_for_function(
            "id => { const el = document.getElementById(id); "
            "return el && el.getAttribute('aria-disabled') !== 'true' && "
            "!el.className.includes('p_AFDisabled'); }",
            arg=MOSTRAR_BUTTON,
            timeout=15000,
        )
        self.page.locator(f"{_css_id(MOSTRAR_BUTTON)} a").click()
        self._settle()

    def list_asignaturas(self):
        """Returns the result table rows: codigo, nombre, creditos, tipologia,
        descripcion, and the DOM id of the "Codigo" link used to expand it."""
        soup = BeautifulSoup(self.page.content(), "html.parser")
        table = soup.select_one("table.af_table_data-table")
        if table is None:
            return []

        rows = []
        for tr in table.select("tr"):
            cells = tr.find_all("td", recursive=False)
            if len(cells) < 5:
                continue
            link = cells[0].find("a")
            if link is None:
                continue
            codigo_text = cells[0].get_text(" ", strip=True)
            rows.append(
                {
                    "link_id": link["id"],
                    "codigo": codigo_text,
                    "nombre": cells[1].get_text(" ", strip=True),
                    "creditos": cells[2].get_text(" ", strip=True),
                    "tipologia": cells[3].get_text(" ", strip=True),
                    "descripcion": cells[4].get_text(" ", strip=True),
                }
            )
        return rows

    def expand_asignatura(self, link_id):
        """Clicks a result row's Codigo link and returns the BeautifulSoup
        for the expanded detail (contains Grupo/horario data), then goes
        back to the results list."""
        self.page.locator(_css_id(link_id)).click()
        self._settle()
        soup = BeautifulSoup(self.page.content(), "html.parser")

        volver = self.page.locator("a.af_button_link", has_text="Volver").first
        volver.click()
        self._settle()

        return soup

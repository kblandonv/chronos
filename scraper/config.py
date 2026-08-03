import os

from dotenv import load_dotenv

load_dotenv()

SIA_CATALOGO_URL = os.environ["SIA_CATALOGO_URL"]
DATABASE_URL = os.environ["DATABASE_URL"]

# The SIA "Nivel de estudio" and "Sede" option values are stable page
# constants, not deployment config, so they stay as code
# constants rather than env vars.
NIVELES = {
    "pregrado": "0",
    "doctorado": "1",
    "postgrado": "2",
}
SEDE_MEDELLIN = "6"

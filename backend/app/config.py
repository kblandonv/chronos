import os

from dotenv import load_dotenv

from shared.db_url import normalize_database_url

load_dotenv()

DATABASE_URL = normalize_database_url(os.environ["DATABASE_URL"])
AUTH0_DOMAIN = os.environ["AUTH0_DOMAIN"]
AUTH0_AUDIENCE = os.environ["AUTH0_AUDIENCE"]
FRONTEND_ORIGINS = [
    o.strip() for o in os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(",") if o.strip()
]

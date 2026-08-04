def normalize_database_url(url: str) -> str:
    """Some providers (Neon, Heroku-style) hand out a bare postgres:// or
    postgresql:// URL with no driver specified. SQLAlchemy then defaults to
    the psycopg2 dialect, which isn't installed here -- only psycopg (v3)
    is (see backend/requirements.txt, scraper/requirements.txt). Force it."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url

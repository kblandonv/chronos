from sqlmodel import Session, create_engine

from config import DATABASE_URL
from shared.db_url import normalize_database_url

engine = create_engine(normalize_database_url(DATABASE_URL))


def get_session():
    return Session(engine)

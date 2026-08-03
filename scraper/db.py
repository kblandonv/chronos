from sqlmodel import Session, create_engine

from config import DATABASE_URL

engine = create_engine(DATABASE_URL)


def get_session():
    return Session(engine)

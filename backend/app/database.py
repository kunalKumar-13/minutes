"""SQLAlchemy engine, session factory and FTS bootstrap."""
from collections.abc import Iterator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Declarative base for every ORM model."""


@event.listens_for(engine, "connect")
def _set_sqlite_pragmas(dbapi_connection, _record) -> None:
    """Foreign keys are off by default in SQLite; WAL keeps reads concurrent."""
    if not settings.database_url.startswith("sqlite"):
        return
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a request-scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


FTS_SETUP = """
CREATE VIRTUAL TABLE IF NOT EXISTS transcript_fts USING fts5(
    text,
    speaker_name,
    segment_id UNINDEXED,
    meeting_id UNINDEXED,
    tokenize = 'porter unicode61'
);
"""


def init_fts() -> None:
    """Create the full-text index used by transcript and global search."""
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as conn:
        conn.execute(text(FTS_SETUP))

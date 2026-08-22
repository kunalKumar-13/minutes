"""Test fixtures.

Every test runs against a throwaway SQLite file in a tmp dir. The database URL
is set before `app.config` is imported so the engine binds to it, and auto-seed
is switched off so tests control their own data.
"""
from __future__ import annotations

import os
import tempfile
from collections.abc import Iterator
from pathlib import Path

import pytest

TMP_DIR = Path(tempfile.mkdtemp(prefix="fireflies-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{TMP_DIR / 'test.db'}"
os.environ["AUTO_SEED"] = "false"
os.environ.pop("ANTHROPIC_API_KEY", None)

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app import models  # noqa: E402
from app.database import Base, SessionLocal, engine, init_fts  # noqa: E402
from app.main import app  # noqa: E402
from app.seed.seed import seed_database  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _schema() -> Iterator[None]:
    Base.metadata.create_all(bind=engine)
    init_fts()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _wipe(session: Session) -> None:
    from sqlalchemy import text

    for meeting in session.query(models.Meeting).all():
        session.delete(meeting)
    session.query(models.Tag).delete()
    session.execute(text("DELETE FROM transcript_fts"))
    session.commit()


@pytest.fixture
def seeded(db: Session) -> Iterator[Session]:
    """A workspace with the full sample data, torn down afterwards."""
    _wipe(db)
    seed_database(db)
    yield db
    _wipe(db)


@pytest.fixture
def client(seeded: Session) -> Iterator[TestClient]:
    # The app's lifespan would re-create the schema; the fixture above already
    # did, and AUTO_SEED is off, so entering it is harmless and keeps the
    # startup path under test.
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def empty_client(db: Session) -> Iterator[TestClient]:
    """A client with a seeded owner but no meetings."""
    _wipe(db)
    if db.query(models.User).count() == 0:
        db.add(models.User(name="Kunal Kumar", email="kunal@fireflies.dev", initials="KK"))
        db.commit()
    with TestClient(app) as test_client:
        yield test_client
    _wipe(db)

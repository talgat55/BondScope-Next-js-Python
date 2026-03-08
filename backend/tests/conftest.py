"""
Pytest fixtures: test client with in-memory SQLite, no real API keys.
"""
import os
import sys
from collections.abc import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure AI is disabled in tests so we don't call Mistral
os.environ.pop("MISTRAL_API_KEY", None)

# Allow importing main even when mistralai is missing or old (tests don't call Mistral)
if "mistralai" not in sys.modules or not hasattr(sys.modules.get("mistralai"), "Mistral"):
    mock_mistral = MagicMock()
    if "mistralai" not in sys.modules:
        sys.modules["mistralai"] = MagicMock(Mistral=mock_mistral)
    else:
        sys.modules["mistralai"].Mistral = mock_mistral

from database import Base, get_db
import models  # noqa: E402 - register models with Base
from main import app  # noqa: E402

# StaticPool so all connections share the same in-memory DB (SQLite :memory: is per-connection by default)
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def get_test_db() -> Generator:
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """Test client with in-memory DB. Tables created per test run."""
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = get_test_db
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Direct DB session for unit tests (e.g. facts)."""
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app import database
from app.main import app


@pytest.fixture()
def isolated_db(tmp_path, monkeypatch) -> Iterator[str]:
    db_path = tmp_path / "siege-test.db"
    monkeypatch.setenv("SIEGE_DB_PATH", str(db_path))
    monkeypatch.setenv("SIEGE_ATTACK_DELAY_SECONDS", "0")
    database.init_db()
    yield str(db_path)


@pytest.fixture()
def client(isolated_db: str) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


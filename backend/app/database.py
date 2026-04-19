from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator


DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "siege.db"
VALID_STATUSES = {"queued", "running", "completed", "failed"}


def get_db_path() -> Path:
    return Path(os.getenv("SIEGE_DB_PATH", str(DEFAULT_DB_PATH)))


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path, timeout=30)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    with connect() as connection:
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS Campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_url TEXT,
                status TEXT NOT NULL,
                overall_score INTEGER
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS AttackLogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                attacker_persona TEXT NOT NULL,
                prompt_sent TEXT NOT NULL,
                target_response TEXT NOT NULL,
                judge_verdict TEXT NOT NULL,
                FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
            )
            """
        )


def create_campaign(target_url: str | None) -> int:
    with connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO Campaigns (target_url, status, overall_score)
            VALUES (?, ?, ?)
            """,
            (target_url, "queued", 0),
        )
        return int(cursor.lastrowid)


def get_campaign(campaign_id: int) -> dict[str, Any] | None:
    with connect() as connection:
        row = connection.execute(
            """
            SELECT id, target_url, status, overall_score
            FROM Campaigns
            WHERE id = ?
            """,
            (campaign_id,),
        ).fetchone()
    return dict(row) if row else None


def update_campaign_status(
    campaign_id: int,
    status: str,
    overall_score: int | None = None,
) -> None:
    if status not in VALID_STATUSES:
        raise ValueError(f"Invalid campaign status: {status}")

    with connect() as connection:
        if overall_score is None:
            connection.execute(
                """
                UPDATE Campaigns
                SET status = ?
                WHERE id = ?
                """,
                (status, campaign_id),
            )
        else:
            connection.execute(
                """
                UPDATE Campaigns
                SET status = ?, overall_score = ?
                WHERE id = ?
                """,
                (status, overall_score, campaign_id),
            )


def add_attack_log(
    campaign_id: int,
    attacker_persona: str,
    prompt_sent: str,
    target_response: str,
    judge_verdict: dict[str, str],
) -> int:
    with connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO AttackLogs (
                campaign_id,
                attacker_persona,
                prompt_sent,
                target_response,
                judge_verdict
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                campaign_id,
                attacker_persona,
                prompt_sent,
                target_response,
                json.dumps(judge_verdict),
            ),
        )
        return int(cursor.lastrowid)


def list_attack_logs(campaign_id: int) -> list[dict[str, Any]]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                campaign_id,
                attacker_persona,
                prompt_sent,
                target_response,
                judge_verdict
            FROM AttackLogs
            WHERE campaign_id = ?
            ORDER BY id ASC
            """,
            (campaign_id,),
        ).fetchall()

    logs = []
    for row in rows:
        log = dict(row)
        try:
            log["judge_verdict"] = json.loads(log["judge_verdict"])
        except json.JSONDecodeError:
            log["judge_verdict"] = {
                "verdict": "Fail",
                "reason": "Stored judge verdict was not valid JSON.",
            }
        logs.append(log)
    return logs


def campaign_progress(campaign_id: int, expected_logs: int = 6) -> int:
    with connect() as connection:
        row = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM AttackLogs
            WHERE campaign_id = ?
            """,
            (campaign_id,),
        ).fetchone()

    count = int(row["count"]) if row else 0
    if expected_logs <= 0:
        return 0
    return min(100, round((count / expected_logs) * 100))


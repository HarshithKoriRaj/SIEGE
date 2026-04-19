from __future__ import annotations

import pytest

from app import database
from app.siege_engine import run_siege_campaign


@pytest.mark.asyncio()
async def test_run_siege_campaign_completes_mock_campaign(isolated_db: str) -> None:
    campaign_id = database.create_campaign(target_url=None)

    await run_siege_campaign(
        campaign_id=campaign_id,
        target_url=None,
        target_description="Retail support chatbot",
    )

    campaign = database.get_campaign(campaign_id)
    logs = database.list_attack_logs(campaign_id)

    assert campaign is not None
    assert campaign["status"] == "completed"
    assert campaign["overall_score"] == 50
    assert len(logs) == 6
    assert sum(1 for log in logs if log["judge_verdict"]["verdict"] == "Fail") == 3


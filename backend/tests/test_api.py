from __future__ import annotations

from fastapi.testclient import TestClient


def test_start_siege_creates_campaign(client: TestClient) -> None:
    response = client.post(
        "/api/start-siege",
        json={
            "target_url": None,
            "target_description": "Customer support chatbot",
        },
    )

    assert response.status_code == 202
    body = response.json()
    assert body["campaign_id"] == 1
    assert body["status"] == "queued"


def test_get_campaign_returns_status_progress_score_and_logs(
    client: TestClient,
) -> None:
    start_response = client.post(
        "/api/start-siege",
        json={
            "target_url": None,
            "target_description": "Ecommerce chatbot",
        },
    )
    campaign_id = start_response.json()["campaign_id"]

    response = client.get(f"/api/campaign/{campaign_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == campaign_id
    assert body["status"] == "completed"
    assert body["overall_score"] == 50
    assert body["progress"] == 100
    assert len(body["logs"]) == 6
    assert {
        log["attacker_persona"] for log in body["logs"]
    } == {
        "The Angry Customer",
        "The Prompt Injector",
        "The Competitor Researcher",
    }


def test_get_campaign_unknown_id_returns_404(client: TestClient) -> None:
    response = client.get("/api/campaign/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign not found"


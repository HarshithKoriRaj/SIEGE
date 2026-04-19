from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import database
from app.schemas import CampaignResponse, StartSiegeRequest, StartSiegeResponse
from app.siege_engine import run_siege_campaign


def cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    database.init_db()
    yield


app = FastAPI(title="Siege API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/start-siege", response_model=StartSiegeResponse, status_code=202)
async def start_siege(
    request: StartSiegeRequest,
    background_tasks: BackgroundTasks,
) -> StartSiegeResponse:
    campaign_id = database.create_campaign(request.target_url)
    background_tasks.add_task(
        run_siege_campaign,
        campaign_id,
        request.target_url,
        request.target_description,
    )
    return StartSiegeResponse(campaign_id=campaign_id, status="queued")


@app.get("/api/campaign/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: int) -> CampaignResponse:
    campaign = database.get_campaign(campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return CampaignResponse(
        **campaign,
        progress=database.campaign_progress(campaign_id),
        logs=database.list_attack_logs(campaign_id),
    )

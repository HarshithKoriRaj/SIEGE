from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StartSiegeRequest(BaseModel):
    target_url: str | None = Field(default=None)
    target_description: str = Field(min_length=1)

    @field_validator("target_url")
    @classmethod
    def normalize_target_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("target_description")
    @classmethod
    def normalize_target_description(cls, value: str) -> str:
        return value.strip()


class StartSiegeResponse(BaseModel):
    campaign_id: int
    status: str


class JudgeVerdict(BaseModel):
    verdict: str
    reason: str


class AttackLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int
    campaign_id: int
    attacker_persona: str
    prompt_sent: str
    target_response: str
    judge_verdict: JudgeVerdict


class CampaignResponse(BaseModel):
    id: int
    target_url: str | None
    status: str
    overall_score: int
    progress: int
    logs: list[AttackLogResponse]


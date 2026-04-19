from __future__ import annotations

import asyncio
import os

from app import database
from app.agents import (
    AttackerPersona,
    architect_generate_personas,
    build_attack_prompts,
    judge_interaction,
)
from app.target_client import send_prompt_to_target


EXPECTED_ATTACK_LOGS = 6


def attack_delay_seconds() -> float:
    raw_value = os.getenv("SIEGE_ATTACK_DELAY_SECONDS", "0.2")
    try:
        return max(0.0, float(raw_value))
    except ValueError:
        return 0.2


async def run_siege_campaign(
    campaign_id: int,
    target_url: str | None,
    target_description: str,
) -> None:
    database.update_campaign_status(campaign_id, "running")
    try:
        personas = architect_generate_personas(target_description)
        persona_results = await asyncio.gather(
            *[
                run_shadow_attacker(
                    campaign_id,
                    target_url,
                    target_description,
                    persona,
                )
                for persona in personas
            ]
        )
        verdicts = [verdict for results in persona_results for verdict in results]
        failed_count = sum(1 for verdict in verdicts if verdict["verdict"] == "Fail")
        total_count = len(verdicts) or EXPECTED_ATTACK_LOGS
        score = round((failed_count / total_count) * 100)
        database.update_campaign_status(campaign_id, "completed", score)
    except Exception:
        database.update_campaign_status(campaign_id, "failed")
        raise


async def run_shadow_attacker(
    campaign_id: int,
    target_url: str | None,
    target_description: str,
    persona: AttackerPersona,
) -> list[dict[str, str]]:
    verdicts: list[dict[str, str]] = []
    prompts = build_attack_prompts(persona, target_description)
    delay = attack_delay_seconds()

    for prompt in prompts:
        if delay:
            await asyncio.sleep(delay)
        target_response = await send_prompt_to_target(target_url, prompt)
        verdict = judge_interaction(prompt, target_response)
        database.add_attack_log(
            campaign_id=campaign_id,
            attacker_persona=persona.name,
            prompt_sent=prompt,
            target_response=target_response,
            judge_verdict=verdict,
        )
        verdicts.append(verdict)

    return verdicts

import type { Campaign, StartSiegeResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function startSiege(
  targetUrl: string | null,
  targetDescription: string,
): Promise<StartSiegeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/start-siege`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target_url: targetUrl,
      target_description: targetDescription,
    }),
  });

  if (!response.ok) {
    throw new Error(`Siege launch failed with status ${response.status}`);
  }

  return response.json() as Promise<StartSiegeResponse>;
}

export async function fetchCampaign(campaignId: number): Promise<Campaign> {
  const response = await fetch(`${API_BASE_URL}/api/campaign/${campaignId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Campaign fetch failed with status ${response.status}`);
  }

  return response.json() as Promise<Campaign>;
}


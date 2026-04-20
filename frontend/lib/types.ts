export type JudgeVerdict = {
  verdict: "Pass" | "Fail";
  reason: string;
};

export type AttackLog = {
  id: number;
  campaign_id: number;
  attacker_persona: string;
  prompt_sent: string;
  target_response: string;
  judge_verdict: JudgeVerdict;
};

export type Campaign = {
  id: number;
  target_url: string | null;
  status: "queued" | "running" | "completed" | "failed";
  overall_score: number;
  progress: number;
  logs: AttackLog[];
};

export type StartSiegeResponse = {
  campaign_id: number;
  status: string;
};


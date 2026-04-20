"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  Crosshair,
  Loader2,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { fetchCampaign, startSiege } from "@/lib/api";
import type { AttackLog, Campaign } from "@/lib/types";

const PERSONA_CODES: Record<string, string> = {
  "The Angry Customer": "ANGER-01",
  "The Prompt Injector": "INJECT-02",
  "The Competitor Researcher": "RIVAL-03",
};

function normalizeEndpoint(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

function campaignDescription(endpoint: string | null): string {
  if (!endpoint) {
    return "Mock chatbot endpoint for local Siege validation";
  }

  try {
    const url = new URL(endpoint);
    return `Chatbot API endpoint hosted at ${url.hostname}`;
  } catch {
    return `Chatbot API endpoint at ${endpoint}`;
  }
}

function statusCopy(status: Campaign["status"] | "idle"): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Live fire";
    case "completed":
      return "Report ready";
    case "failed":
      return "Faulted";
    default:
      return "Standing by";
  }
}

function statusTone(status: Campaign["status"] | "idle"): string {
  switch (status) {
    case "completed":
      return "border-[rgba(77,255,180,0.45)] bg-[rgba(77,255,180,0.1)] text-[#aaffd9]";
    case "failed":
      return "border-[rgba(255,87,87,0.5)] bg-[rgba(255,87,87,0.12)] text-[#ff9b9b]";
    case "running":
      return "border-[rgba(255,202,88,0.52)] bg-[rgba(255,202,88,0.12)] text-[#ffe0a0]";
    case "queued":
      return "border-[rgba(144,168,178,0.42)] bg-[rgba(144,168,178,0.1)] text-[#c3d6dd]";
    default:
      return "border-[rgba(238,245,233,0.18)] bg-[rgba(238,245,233,0.06)] text-[#8c9a8e]";
  }
}

function verdictTone(verdict: string): string {
  return verdict === "Fail"
    ? "border-[rgba(255,87,87,0.42)] bg-[rgba(255,87,87,0.13)] text-[#ffb2a8]"
    : "border-[rgba(77,255,180,0.38)] bg-[rgba(77,255,180,0.11)] text-[#b8ffdc]";
}

function TerminalFeed({ logs, status }: { logs: AttackLog[]; status: Campaign["status"] | "idle" }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [logs.length]);

  return (
    <section className="clip-panel border border-[rgba(77,255,180,0.24)] bg-[#07100c]/88 shadow-signal backdrop-blur-xl">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-[rgba(77,255,180,0.2)] bg-[rgba(77,255,180,0.06)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <TerminalSquare className="h-5 w-5 text-[#4dffb4]" aria-hidden="true" />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#4dffb4]">Shadow terminal</p>
            <p className="text-xs text-[#8c9a8e]">Campaign process stream</p>
          </div>
        </div>
        <div className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase ${statusTone(status)}`}>
          {statusCopy(status)}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="terminal-scroll h-[26rem] overflow-y-auto px-4 py-4 font-mono text-xs sm:px-5"
      >
        {logs.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-[#6f8073]">
            <div>
              <Radar className="mx-auto mb-4 h-10 w-10 animate-pulse text-[#4dffb4]" aria-hidden="true" />
              <p className="uppercase tracking-[0.18em]">Awaiting first strike packet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <article
                key={log.id}
                className="animate-rise border-l border-[rgba(77,255,180,0.42)] bg-[rgba(255,255,255,0.035)] px-3 py-3"
                style={{ animationDelay: `${Math.min(index * 45, 280)}ms` }}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[#ffca58]">[{String(log.id).padStart(3, "0")}]</span>
                  <span className="text-[#4dffb4]">{PERSONA_CODES[log.attacker_persona] ?? "SHADOW"}</span>
                  <span className="text-[#8c9a8e]">{log.attacker_persona}</span>
                  <span className={`rounded-full border px-2 py-0.5 ${verdictTone(log.judge_verdict.verdict)}`}>
                    {log.judge_verdict.verdict}
                  </span>
                </div>
                <p className="break-words text-[#dfe8d9]">
                  <span className="text-[#75887a]">prompt:</span> {log.prompt_sent}
                </p>
                <p className="mt-2 break-words text-[#a9b9ad]">
                  <span className="text-[#75887a]">target:</span> {log.target_response}
                </p>
                <p className="mt-2 break-words text-[#ffdf9b]">
                  <span className="text-[#75887a]">judge:</span> {log.judge_verdict.reason}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProgressRail({ campaign }: { campaign: Campaign | null }) {
  const progress = campaign?.progress ?? 0;
  const logs = campaign?.logs.length ?? 0;
  const failed = campaign?.logs.filter((log) => log.judge_verdict.verdict === "Fail").length ?? 0;

  return (
    <section className="border-y border-[rgba(238,245,233,0.14)] bg-[rgba(9,12,10,0.72)] px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-[#8c9a8e]">
              <Activity className="h-4 w-4 text-[#4dffb4]" aria-hidden="true" />
              Attack progression
            </div>
            <span className="font-mono text-sm text-[#eef5e9]">{progress}%</span>
          </div>
          <div className="h-4 overflow-hidden border border-[rgba(77,255,180,0.28)] bg-[#07100c]">
            <div
              className="h-full bg-[linear-gradient(90deg,#4dffb4,#ffca58,#ff5757)] transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 border border-[rgba(238,245,233,0.14)] bg-[rgba(255,255,255,0.035)]">
          <Metric label="Logs" value={logs.toString()} />
          <Metric label="Fails" value={failed.toString()} />
          <Metric label="Score" value={`${campaign?.overall_score ?? 0}`} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-[rgba(238,245,233,0.12)] px-3 py-3 last:border-r-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#75887a]">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-[#eef5e9]">{value}</p>
    </div>
  );
}

function FragilityReport({ campaign }: { campaign: Campaign | null }) {
  const failedLogs = useMemo(
    () => campaign?.logs.filter((log) => log.judge_verdict.verdict === "Fail") ?? [],
    [campaign],
  );

  if (!campaign || campaign.status !== "completed") {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="clip-panel border border-[rgba(255,202,88,0.26)] bg-[#11120e]/90 backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
          <div className="border-b border-[rgba(255,202,88,0.18)] p-6 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-[#ffca58]" aria-hidden="true" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ffca58]">Fragility report</p>
            </div>
            <p className="font-display text-6xl leading-none text-[#eef5e9]">{campaign.overall_score}</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-[#8c9a8e]">
              Vulnerability score
            </p>
            <p className="mt-5 text-sm leading-6 text-[#aebbad]">
              {failedLogs.length === 0
                ? "No failed interactions were detected by the MVP judge."
                : `${failedLogs.length} failed interaction${failedLogs.length === 1 ? "" : "s"} detected across the campaign.`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(238,245,233,0.14)] font-mono text-[11px] uppercase tracking-[0.16em] text-[#8c9a8e]">
                  <th className="px-4 py-4 font-medium">Agent</th>
                  <th className="px-4 py-4 font-medium">Prompt</th>
                  <th className="px-4 py-4 font-medium">Target response</th>
                  <th className="px-4 py-4 font-medium">Judge reason</th>
                </tr>
              </thead>
              <tbody>
                {failedLogs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-[#aebbad]" colSpan={4}>
                      No failed interactions to list.
                    </td>
                  </tr>
                ) : (
                  failedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[rgba(238,245,233,0.1)] last:border-b-0">
                      <td className="px-4 py-4 align-top font-mono text-xs text-[#ffca58]">
                        {PERSONA_CODES[log.attacker_persona] ?? log.attacker_persona}
                      </td>
                      <td className="max-w-[18rem] px-4 py-4 align-top text-[#dfe8d9]">{log.prompt_sent}</td>
                      <td className="max-w-[20rem] px-4 py-4 align-top text-[#a9b9ad]">{log.target_response}</td>
                      <td className="max-w-[18rem] px-4 py-4 align-top text-[#ffb2a8]">{log.judge_verdict.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function LaunchPanel({
  endpoint,
  setEndpoint,
  isLaunching,
  error,
  onSubmit,
}: {
  endpoint: string;
  setEndpoint: (value: string) => void;
  isLaunching: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-3xl">
      <label className="sr-only" htmlFor="target-endpoint">
        Chatbot API endpoint
      </label>
      <div className="clip-panel flex flex-col border border-[rgba(77,255,180,0.3)] bg-[#0d120f]/92 p-2 shadow-signal backdrop-blur-xl sm:flex-row">
        <div className="flex min-h-14 flex-1 items-center gap-3 px-4">
          <Crosshair className="h-5 w-5 shrink-0 text-[#4dffb4]" aria-hidden="true" />
          <input
            id="target-endpoint"
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            placeholder="Enter your chatbot's API Endpoint to stress-test it."
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-[#eef5e9] outline-none placeholder:text-[#6f8073]"
          />
        </div>
        <button
          disabled={isLaunching}
          className="group mt-2 inline-flex min-h-12 items-center justify-center gap-2 border border-[rgba(255,202,88,0.42)] bg-[#ffca58] px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#11120e] transition hover:bg-[#ffe09b] disabled:opacity-60 sm:mt-0"
          type="submit"
        >
          {isLaunching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Zap className="h-4 w-4" aria-hidden="true" />}
          Launch
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
      {error ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-[#ff9b9b]">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      ) : (
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-[#75887a]">Target acquisition line ready.</p>
      )}
    </form>
  );
}

export function SiegeCommandCenter() {
  const [endpoint, setEndpoint] = useState("");
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = campaign?.status ?? (campaignId ? "queued" : "idle");
  const failedCount = campaign?.logs.filter((log) => log.judge_verdict.verdict === "Fail").length ?? 0;

  async function launchSiege(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLaunching(true);
    setCampaign(null);

    const targetUrl = normalizeEndpoint(endpoint);
    try {
      const response = await startSiege(targetUrl, campaignDescription(targetUrl));
      setCampaignId(response.campaign_id);
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : "Unable to launch Siege.");
      setCampaignId(null);
    } finally {
      setIsLaunching(false);
    }
  }

  useEffect(() => {
    if (!campaignId) {
      return;
    }

    let cancelled = false;

    async function refreshCampaign() {
      try {
        const nextCampaign = await fetchCampaign(campaignId as number);
        if (!cancelled) {
          setCampaign(nextCampaign);
          setError(null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch campaign.");
        }
      }
    }

    refreshCampaign();
    const intervalId = window.setInterval(refreshCampaign, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [campaignId]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="noise" />
      <div className="absolute inset-x-0 top-0 z-0 h-px bg-[linear-gradient(90deg,transparent,#4dffb4,#ffca58,transparent)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(135deg,rgba(77,255,180,0.05),transparent_26%,rgba(255,202,88,0.04)_58%,transparent)]" />
      <div className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full opacity-35 [background-image:linear-gradient(120deg,transparent_0%,transparent_45%,rgba(77,255,180,0.12)_45%,rgba(77,255,180,0.12)_46%,transparent_46%,transparent_100%)]" />

      <section className="relative z-10 mx-auto grid min-h-[84vh] max-w-7xl grid-cols-1 gap-10 px-4 pb-12 pt-7 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_360px] lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 border border-[rgba(77,255,180,0.3)] bg-[rgba(77,255,180,0.08)] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-[#b8ffdc]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Siege
            </span>
            <span className="inline-flex items-center gap-2 border border-[rgba(255,202,88,0.28)] bg-[rgba(255,202,88,0.08)] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-[#ffe0a0]">
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              Shadow agent grid
            </span>
          </div>

          <h1 className="max-w-4xl font-display text-5xl leading-[0.98] text-[#eef5e9]">
            Siege Command Center
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#aebbad]">
            Launch coordinated adversarial probes against a chatbot endpoint, watch the Shadow Agents move, and read the fragility report as soon as the run completes.
          </p>

          <LaunchPanel
            endpoint={endpoint}
            setEndpoint={setEndpoint}
            isLaunching={isLaunching}
            error={error}
            onSubmit={launchSiege}
          />
        </div>

        <aside className="self-center border border-[rgba(238,245,233,0.14)] bg-[rgba(10,14,11,0.78)] p-5 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#75887a]">Campaign state</p>
              <p className="mt-1 text-2xl font-semibold text-[#eef5e9]">{statusCopy(status)}</p>
            </div>
            <Bot className="h-8 w-8 text-[#4dffb4]" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <SideSignal
              icon={<Radar className="h-4 w-4" aria-hidden="true" />}
              label="Architect"
              value={campaignId ? "Personas issued" : "Idle"}
              active={Boolean(campaignId)}
            />
            <SideSignal
              icon={<Zap className="h-4 w-4" aria-hidden="true" />}
              label="Shadow Agents"
              value={`${campaign?.logs.length ?? 0}/6 strikes`}
              active={(campaign?.logs.length ?? 0) > 0}
            />
            <SideSignal
              icon={failedCount > 0 ? <ShieldAlert className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              label="Judge"
              value={campaign ? `${failedCount} failures` : "Waiting"}
              active={Boolean(campaign)}
              danger={failedCount > 0}
            />
          </div>
          <div className="mt-6 border-t border-[rgba(238,245,233,0.12)] pt-5">
            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.16em] text-[#75887a]">
              <span>Endpoint</span>
              <span>{campaignId ? `#${campaignId}` : "none"}</span>
            </div>
            <p className="mt-2 break-words text-sm text-[#aebbad]">{campaign?.target_url ?? "Local mock target"}</p>
          </div>
        </aside>
      </section>

      <div className="relative z-10">
        <ProgressRail campaign={campaign} />
      </div>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-8">
        <TerminalFeed logs={campaign?.logs ?? []} status={status} />
        <div className="grid gap-4 content-start">
          <IntelTile
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            label="Resisted"
            value={(campaign?.logs.filter((log) => log.judge_verdict.verdict === "Pass").length ?? 0).toString()}
            tone="good"
          />
          <IntelTile
            icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
            label="Broken"
            value={failedCount.toString()}
            tone="bad"
          />
          <IntelTile
            icon={<Activity className="h-5 w-5" aria-hidden="true" />}
            label="Completion"
            value={`${campaign?.progress ?? 0}%`}
            tone="neutral"
          />
        </div>
      </section>

      <FragilityReport campaign={campaign} />
    </main>
  );
}

function SideSignal({
  icon,
  label,
  value,
  active,
  danger,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  active: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border border-[rgba(238,245,233,0.12)] bg-[rgba(255,255,255,0.035)] px-3 py-3">
      <div
        className={`grid h-9 w-9 place-items-center border ${
          danger
            ? "border-[rgba(255,87,87,0.4)] text-[#ff9b9b]"
            : active
              ? "border-[rgba(77,255,180,0.4)] text-[#4dffb4]"
              : "border-[rgba(238,245,233,0.12)] text-[#75887a]"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#75887a]">{label}</p>
        <p className="truncate text-sm text-[#eef5e9]">{value}</p>
      </div>
    </div>
  );
}

function IntelTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "border-[rgba(77,255,180,0.28)] text-[#4dffb4]"
      : tone === "bad"
        ? "border-[rgba(255,87,87,0.34)] text-[#ff9b9b]"
        : "border-[rgba(255,202,88,0.3)] text-[#ffca58]";

  return (
    <div className={`border bg-[rgba(255,255,255,0.035)] p-5 ${toneClass}`}>
      <div className="mb-6 flex items-center justify-between">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#75887a]">{label}</span>
      </div>
      <p className="font-mono text-5xl font-semibold leading-none text-[#eef5e9]">{value}</p>
    </div>
  );
}

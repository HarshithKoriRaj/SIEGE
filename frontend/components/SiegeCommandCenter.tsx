"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Bot,
  CheckCircle2,
  Crosshair,
  Eye,
  Flame,
  Loader2,
  LockKeyhole,
  Radar,
  ShieldAlert,
  ShieldCheck,
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
  return trimmed || null;
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
      return "border-[rgba(255,46,46,0.5)] bg-[rgba(255,46,46,0.12)] text-[#ffd0d0]";
    case "failed":
      return "border-[rgba(255,0,64,0.58)] bg-[rgba(255,0,64,0.18)] text-[#ff8aa4]";
    case "running":
      return "border-[rgba(255,58,58,0.6)] bg-[rgba(255,58,58,0.15)] text-[#ffb1a7]";
    case "queued":
      return "border-[rgba(204,36,36,0.5)] bg-[rgba(204,36,36,0.12)] text-[#e3b7b7]";
    default:
      return "border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.05)] text-[#9f8d8d]";
  }
}

function verdictTone(verdict: string): string {
  return verdict === "Fail"
    ? "border-[rgba(255,30,70,0.54)] bg-[rgba(255,30,70,0.17)] text-[#ff9aad]"
    : "border-[rgba(177,191,177,0.3)] bg-[rgba(177,191,177,0.08)] text-[#d7ded0]";
}

function BreachScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,0,0,0.95)_0%,rgba(23,0,4,0.82)_45%,rgba(0,0,0,0.98)_100%)]" />
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,42,42,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,42,0.14)_1px,transparent_1px)] [background-size:76px_76px]" />
      <div className="absolute inset-0 breach-etch" />
      <div className="absolute left-[-12rem] top-[14%] h-[34rem] w-[34rem] rotate-45 border border-[#7f1111]/70" />
      <div className="absolute right-[-10rem] top-[8%] h-[30rem] w-[30rem] rotate-12 border border-[#ff2b2b]/28" />
      <div className="absolute bottom-[-14rem] left-[36%] h-[28rem] w-[28rem] rotate-[28deg] border border-[#441010]/80" />
      <div className="absolute left-[52%] top-[12%] h-[72vh] w-px bg-[linear-gradient(transparent,#ff2b2b,transparent)] opacity-70" />
      <div className="absolute left-[8%] top-[18%] h-[58vh] w-[70vw] border-l border-t border-[#ff2b2b]/24" />
      <div className="absolute right-[12%] top-[18%] h-[13rem] w-[13rem] rounded-full border border-[#ff2b2b]/45">
        <div className="absolute inset-5 rounded-full border border-[#ff2b2b]/24" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-[#ff2b2b]/30" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-[#ff2b2b]/30" />
      </div>
      <div className="absolute bottom-16 right-10 hidden w-[28rem] border border-[#ff2b2b]/24 bg-black/42 p-4 font-mono text-[11px] text-[#ff7a7a] lg:block">
        <p>trace://shadow-grid/persona/03</p>
        <p className="mt-2 text-[#d9c7c7]">BREACH MAP ACTIVE</p>
        <p className="mt-2">risk vectors: prompt-injection | coercion | leakage</p>
      </div>
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(rgba(255,0,0,0.2),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(transparent,#050000_78%)]" />
      <div className="absolute inset-0 animate-scan bg-[linear-gradient(180deg,transparent,rgba(255,42,42,0.14),transparent)]" />
    </div>
  );
}

function LandingHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden border-b border-[#3a0b0b]">
      <BreachScene />
      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-between px-4 py-7 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center border border-[#ff2b2b] bg-[#160303] text-[#ff2b2b] shadow-danger">
              <Flame className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-2xl leading-none text-[#fff2f2]">SIEGE</p>
              <p className="font-mono text-xs uppercase text-[#b15d5d]">AI red-team platform</p>
            </div>
          </div>
          <a
            href="#command-center"
            className="inline-flex items-center gap-2 border border-[#ff2b2b]/60 bg-black/40 px-4 py-3 font-mono text-xs uppercase text-[#ffd7d7] transition hover:bg-[#ff2b2b] hover:text-black"
          >
            Open command center
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </nav>

        <div className="max-w-5xl pb-12 pt-20">
          <div className="mb-7 inline-flex items-center gap-3 border border-[#ff2b2b]/45 bg-[#120202]/70 px-4 py-2 font-mono text-xs uppercase text-[#ff9090]">
            <Eye className="h-4 w-4" aria-hidden="true" />
            Architect online / Shadow agents armed
          </div>
          <h1 className="max-w-5xl font-display text-6xl leading-[0.9] text-[#fff4f4] drop-shadow-[0_0_34px_rgba(255,0,0,0.22)]">
            Break the bot before the world does.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#d8b9b9]">
            Siege turns a chatbot endpoint into a live adversarial range: three Shadow Agents attack in parallel, a Judge scores each exchange, and the final report exposes the fragile seams.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#command-center"
              className="inline-flex min-h-12 items-center gap-3 bg-[#ff2b2b] px-5 font-mono text-xs font-bold uppercase text-black transition hover:bg-[#ff6b6b]"
            >
              Start a siege
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#fragility"
              className="inline-flex min-h-12 items-center gap-3 border border-[#7d2020] bg-black/42 px-5 font-mono text-xs uppercase text-[#ffd7d7] transition hover:border-[#ff2b2b]"
            >
              View report bay
            </a>
          </div>
        </div>

        <div className="grid gap-3 pb-5 md:grid-cols-3">
          <LandingStat label="Shadow agents" value="3" />
          <LandingStat label="Strike prompts" value="6" />
          <LandingStat label="Poll cadence" value="2s" />
        </div>
      </div>
    </section>
  );
}

function LandingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#401010] bg-black/48 px-4 py-4 backdrop-blur">
      <p className="font-mono text-xs uppercase text-[#9d6a6a]">{label}</p>
      <p className="mt-1 font-display text-4xl leading-none text-[#ffeded]">{value}</p>
    </div>
  );
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
    <section className="clip-panel border border-[#7d2020] bg-[#080101]/92 shadow-danger backdrop-blur-xl">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-[#5e1515] bg-[#190404] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <TerminalSquare className="h-5 w-5 text-[#ff2b2b]" aria-hidden="true" />
          <div>
            <p className="font-mono text-xs uppercase text-[#ff6b6b]">Shadow terminal</p>
            <p className="text-xs text-[#9f8d8d]">Campaign process stream</p>
          </div>
        </div>
        <div className={`border px-3 py-1 font-mono text-[11px] uppercase ${statusTone(status)}`}>
          {statusCopy(status)}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="terminal-scroll h-[26rem] overflow-y-auto px-4 py-4 font-mono text-xs sm:px-5"
      >
        {logs.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-[#7c6767]">
            <div>
              <Radar className="mx-auto mb-4 h-10 w-10 animate-pulse text-[#ff2b2b]" aria-hidden="true" />
              <p className="uppercase">Awaiting first strike packet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <article
                key={log.id}
                className="animate-rise border-l border-[#ff2b2b] bg-[#130303] px-3 py-3"
                style={{ animationDelay: `${Math.min(index * 45, 280)}ms` }}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[#ff3939]">[{String(log.id).padStart(3, "0")}]</span>
                  <span className="text-[#ffb5b5]">{PERSONA_CODES[log.attacker_persona] ?? "SHADOW"}</span>
                  <span className="text-[#9f8d8d]">{log.attacker_persona}</span>
                  <span className={`border px-2 py-0.5 ${verdictTone(log.judge_verdict.verdict)}`}>
                    {log.judge_verdict.verdict}
                  </span>
                </div>
                <p className="break-words text-[#eadede]">
                  <span className="text-[#8a7070]">prompt:</span> {log.prompt_sent}
                </p>
                <p className="mt-2 break-words text-[#bca9a9]">
                  <span className="text-[#8a7070]">target:</span> {log.target_response}
                </p>
                <p className="mt-2 break-words text-[#ff9b9b]">
                  <span className="text-[#8a7070]">judge:</span> {log.judge_verdict.reason}
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
    <section className="border-y border-[#381010] bg-[#090101]/86 px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase text-[#a77a7a]">
              <Activity className="h-4 w-4 text-[#ff2b2b]" aria-hidden="true" />
              Attack progression
            </div>
            <span className="font-mono text-sm text-[#fff2f2]">{progress}%</span>
          </div>
          <div className="h-4 overflow-hidden border border-[#6e1919] bg-black">
            <div
              className="h-full bg-[linear-gradient(90deg,#5d0505,#ff2b2b,#ffd0d0)] transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 border border-[#381010] bg-[#130303]">
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
    <div className="border-r border-[#381010] px-3 py-3 last:border-r-0">
      <p className="font-mono text-[10px] uppercase text-[#9d6a6a]">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-[#fff2f2]">{value}</p>
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
    <section id="fragility" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="clip-panel border border-[#7d2020] bg-[#0e0202]/94 backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
          <div className="border-b border-[#4a1212] p-6 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-[#ff2b2b]" aria-hidden="true" />
              <p className="font-mono text-xs uppercase text-[#ff6b6b]">Fragility report</p>
            </div>
            <p className="font-display text-6xl leading-none text-[#fff2f2]">{campaign.overall_score}</p>
            <p className="mt-2 font-mono text-xs uppercase text-[#9d6a6a]">Vulnerability score</p>
            <p className="mt-5 text-sm leading-6 text-[#cbb8b8]">
              {failedLogs.length === 0
                ? "No failed interactions were detected by the MVP judge."
                : `${failedLogs.length} failed interaction${failedLogs.length === 1 ? "" : "s"} detected across the campaign.`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#381010] font-mono text-[11px] uppercase text-[#9d6a6a]">
                  <th className="px-4 py-4 font-medium">Agent</th>
                  <th className="px-4 py-4 font-medium">Prompt</th>
                  <th className="px-4 py-4 font-medium">Target response</th>
                  <th className="px-4 py-4 font-medium">Judge reason</th>
                </tr>
              </thead>
              <tbody>
                {failedLogs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-[#cbb8b8]" colSpan={4}>
                      No failed interactions to list.
                    </td>
                  </tr>
                ) : (
                  failedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[#2b0909] last:border-b-0">
                      <td className="px-4 py-4 align-top font-mono text-xs text-[#ff6b6b]">
                        {PERSONA_CODES[log.attacker_persona] ?? log.attacker_persona}
                      </td>
                      <td className="max-w-[18rem] px-4 py-4 align-top text-[#eadede]">{log.prompt_sent}</td>
                      <td className="max-w-[20rem] px-4 py-4 align-top text-[#bca9a9]">{log.target_response}</td>
                      <td className="max-w-[18rem] px-4 py-4 align-top text-[#ff9b9b]">{log.judge_verdict.reason}</td>
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
    <form onSubmit={onSubmit} className="mt-8 max-w-4xl">
      <label className="sr-only" htmlFor="target-endpoint">
        Chatbot API endpoint
      </label>
      <div className="clip-panel flex flex-col border border-[#7d2020] bg-[#0b0101]/94 p-2 shadow-danger backdrop-blur-xl sm:flex-row">
        <div className="flex min-h-14 flex-1 items-center gap-3 px-4">
          <Crosshair className="h-5 w-5 shrink-0 text-[#ff2b2b]" aria-hidden="true" />
          <input
            id="target-endpoint"
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            placeholder="Enter your chatbot's API Endpoint to stress-test it."
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-[#fff2f2] outline-none placeholder:text-[#755f5f]"
          />
        </div>
        <button
          disabled={isLaunching}
          className="group mt-2 inline-flex min-h-12 items-center justify-center gap-2 bg-[#ff2b2b] px-5 font-mono text-xs font-bold uppercase text-black transition hover:bg-[#ff6b6b] disabled:opacity-60 sm:mt-0"
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
        <p className="mt-3 font-mono text-xs uppercase text-[#9d6a6a]">Leave blank to fire at the local mock target.</p>
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
      window.setTimeout(() => {
        document.getElementById("command-center")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 180);
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
    <main className="relative min-h-screen overflow-hidden bg-[#050000]">
      <div className="noise" />
      <LandingHero />

      <section
        id="command-center"
        className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_360px] lg:px-8"
      >
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 border border-[#7d2020] bg-[#170303] px-3 py-1.5 font-mono text-xs uppercase text-[#ff9b9b]">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              Command center
            </span>
            <span className="inline-flex items-center gap-2 border border-[#4a1212] bg-black px-3 py-1.5 font-mono text-xs uppercase text-[#c19696]">
              <Bot className="h-3.5 w-3.5" aria-hidden="true" />
              Shadow grid
            </span>
          </div>

          <h2 className="max-w-4xl font-display text-5xl leading-none text-[#fff2f2]">Choose the target.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#cbb8b8]">
            Paste an endpoint that accepts a JSON message, or leave it empty for the built-in mock target. The dashboard below will come alive as soon as the backend starts writing logs.
          </p>

          <LaunchPanel
            endpoint={endpoint}
            setEndpoint={setEndpoint}
            isLaunching={isLaunching}
            error={error}
            onSubmit={launchSiege}
          />
        </div>

        <aside className="self-center border border-[#381010] bg-[#0d0202]/90 p-5 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase text-[#9d6a6a]">Campaign state</p>
              <p className="mt-1 text-2xl font-semibold text-[#fff2f2]">{statusCopy(status)}</p>
            </div>
            <Bot className="h-8 w-8 text-[#ff2b2b]" aria-hidden="true" />
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
          <div className="mt-6 border-t border-[#381010] pt-5">
            <div className="flex items-center justify-between font-mono text-xs uppercase text-[#9d6a6a]">
              <span>Endpoint</span>
              <span>{campaignId ? `#${campaignId}` : "none"}</span>
            </div>
            <p className="mt-2 break-words text-sm text-[#cbb8b8]">{campaign?.target_url ?? "Local mock target"}</p>
          </div>
        </aside>
      </section>

      <div className="relative z-10">
        <ProgressRail campaign={campaign} />
      </div>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-8">
        <TerminalFeed logs={campaign?.logs ?? []} status={status} />
        <div className="grid content-start gap-4">
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
    <div className="flex items-center gap-3 border border-[#381010] bg-[#130303] px-3 py-3">
      <div
        className={`grid h-9 w-9 place-items-center border ${
          danger
            ? "border-[#ff2b2b] text-[#ff8aa4]"
            : active
              ? "border-[#7d2020] text-[#ff2b2b]"
              : "border-[#381010] text-[#806969]"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase text-[#9d6a6a]">{label}</p>
        <p className="truncate text-sm text-[#fff2f2]">{value}</p>
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
      ? "border-[#4b3b3b] text-[#d7ded0]"
      : tone === "bad"
        ? "border-[#8e1c1c] text-[#ff9b9b]"
        : "border-[#7d2020] text-[#ff6b6b]";

  return (
    <div className={`border bg-[#130303] p-5 ${toneClass}`}>
      <div className="mb-6 flex items-center justify-between">
        {icon}
        <span className="font-mono text-[10px] uppercase text-[#9d6a6a]">{label}</span>
      </div>
      <p className="font-mono text-5xl font-semibold leading-none text-[#fff2f2]">{value}</p>
    </div>
  );
}

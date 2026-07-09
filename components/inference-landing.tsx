"use client"

import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import type { AgentInfo, JobRequestInfo } from "@/lib/constants"
import { formatRating } from "@/lib/utils"
import { LiveBlock } from "@/components/live-block"
import { BrandHeroVideo } from "@/components/brand-hero-video"

interface Props {
  agents: AgentInfo[]
  jobs: JobRequestInfo[]
  onchain: boolean
  chainInfo: { block: bigint; chainId: number } | null
}

const PRODUCTS = [
  { href: "/create", n: "01", title: "Deploy", body: "Register agents, install skills, and go live with bonded stake." },
  { href: "/analytics", n: "02", title: "Observe", body: "Live network health — agents, jobs, bond, and chain head." },
  { href: "/dashboard", n: "03", title: "Trace", body: "Follow job lifecycle from request to payout or dispute." },
  { href: "/skills", n: "04", title: "Skills", body: "HTTP & LLM precompiles as installable on-chain skills." },
  { href: "/disputes", n: "05", title: "Evaluate", body: "Staked dispute council keeps outcomes slashable and fair." },
  { href: "/layers", n: "06", title: "Layers", body: "Seven independent layers — never locked to one surface." },
]

export function InferenceLanding({ agents, jobs, onchain, chainInfo }: Props) {
  const openJobs = jobs.filter((j) => j.status === "OPEN").length
  const completed = jobs.filter((j) => j.status === "COMPLETED").length
  const initialBlock = chainInfo ? Number(chainInfo.block) : 0

  return (
    <div>
      {/* Brand film — first thing on the site */}
      <BrandHeroVideo />

      {/* Hero copy under film */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(56rem 28rem at 70% -20%, rgba(255,255,255,0.07), transparent 60%)",
          }}
        />
        <div className="inf-container relative py-14 lg:py-20">
          <div className="max-w-3xl animate-fade-up">
            <p className="inf-eyebrow mb-5">Ritual Chain · agent economy</p>
            <h1 className="text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-[3.75rem] lg:leading-[1.05]">
              Agent marketplace
              <br className="hidden sm:block" />
              {" "}infrastructure for
              <br className="hidden sm:block" />
              {" "}
              <span className="text-muted-foreground">AI-native teams</span>
            </h1>
            <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
              Deploy agents, post tasks, settle escrowed RITUAL — production rails without the noise.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="inf-btn inf-btn-primary h-11 px-5">
                Get Started
                <ArrowRight className="h-4 w-4 opacity-70" />
              </Link>
              <Link href="/join" className="inf-btn inf-btn-ghost h-11 px-5">
                Talk to an Engineer
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${onchain ? "bg-success" : "bg-chart-3"}`} />
                {onchain ? "Live on Ritual" : "RPC unreachable"}
              </span>
              {chainInfo && <span>chain {chainInfo.chainId}</span>}
              <LiveBlock initialBlock={initialBlock} variant="inline" />
              <span className="tabular-nums">{agents.length} agents</span>
              <span className="tabular-nums">{jobs.length} tasks</span>
            </div>
          </div>
        </div>
        <div className="inf-hairline" />
      </section>

      {/* Trust chips */}
      <section>
        <div className="inf-container py-10">
          <p className="mb-5 text-center text-xs text-muted-foreground">
            Built for teams shipping autonomous agents on Ritual Chain
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {["Ritual", "Escrow", "Staking", "HTTP", "LLM", "Disputes"].map((label) => (
              <div
                key={label}
                className="flex h-14 items-center justify-center rounded-xl border border-[#00ff99]/12 bg-card/40 text-xs font-medium tracking-wide text-muted-foreground transition-colors hover:border-[#00ff99]/35 hover:text-[#00ff99]"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="inf-hairline" />
      </section>

      {/* Products */}
      <section>
        <div className="inf-container py-16 lg:py-20">
          <div className="max-w-2xl animate-fade-up">
            <p className="inf-eyebrow mb-3">Product</p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
              Everything to run agents with confidence
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              From identity to settlement — one coherent stack, six focused surfaces.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p, i) => (
              <Link
                key={p.href}
                href={p.href}
                className="inf-card group flex flex-col p-5 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">{p.n}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="inf-hairline" />
      </section>

      {/* Agents */}
      <section id="agents">
        <div className="inf-container py-16 lg:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inf-eyebrow mb-3">Deploy</p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Agents ready to hire
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Live from the registry. Identity, skills, and reputation included.
              </p>
            </div>
            <Link href="/dashboard" className="inf-btn inf-btn-ghost h-9 px-3.5 text-xs">
              Open dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agents.slice(0, 4).map((a, i) => (
              <Link
                key={a.id}
                href={`/agents/${a.id}`}
                className="inf-card group flex flex-col p-4 animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/50 font-mono text-xs font-semibold">
                  {a.name.charAt(0).toUpperCase()}
                </div>
                <p className="truncate text-sm font-semibold tracking-tight">{a.name}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {a.description || "On-chain agent"}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
                  <span>{formatRating(a.avgRating)} · {a.jobCount} jobs</span>
                  <span className="font-medium text-foreground opacity-70 group-hover:opacity-100">View</span>
                </div>
              </Link>
            ))}
            {agents.length === 0 && (
              <div className="inf-card col-span-full px-6 py-12 text-center text-sm text-muted-foreground">
                No agents yet.{" "}
                <Link href="/create" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Deploy the first one
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="inf-hairline" />
      </section>

      {/* Stats */}
      <section>
        <div className="inf-container py-16 lg:py-20">
          <p className="inf-eyebrow mb-3">Observe</p>
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Network performance at a glance
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Agents", value: String(agents.length) },
              { label: "Tasks", value: String(jobs.length) },
              { label: "Open bids", value: String(openJobs) },
              { label: "Completed", value: String(completed) },
            ].map((s, i) => (
              <div key={s.label} className="inf-card p-5 animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <p className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">{s.value}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="inf-hairline" />
      </section>

      {/* Table */}
      <section>
        <div className="inf-container py-16 lg:py-20">
          <p className="inf-eyebrow mb-3">Evaluate</p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Evidence over vibes
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Rank agents by on-chain jobs, ratings, and skills.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5 font-medium">Agent</th>
                  <th className="px-5 py-3.5 font-medium">Jobs</th>
                  <th className="px-5 py-3.5 font-medium">Rating</th>
                  <th className="hidden px-5 py-3.5 font-medium sm:table-cell">Skills</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {agents.slice(0, 6).map((a) => (
                  <tr key={a.id} className="border-b border-border/30 last:border-0 transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-medium tracking-tight">{a.name}</td>
                    <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{a.jobCount}</td>
                    <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{formatRating(a.avgRating)}</td>
                    <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell">{a.skills.length || "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/agents/${a.id}`} className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No agents registered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="inf-hairline" />
      </section>

      {/* CTA */}
      <section>
        <div className="inf-container py-20 text-center lg:py-24">
          <p className="inf-eyebrow mb-4" style={{ color: "#00ff99" }}>Get started</p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Ship the agent stack today
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Registry, escrow, staking, and disputes — production-ready on Ritual.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard" className="inf-btn inf-btn-primary h-11 px-5">
              Open Dashboard
            </Link>
            <Link href="/docs" className="inf-btn inf-btn-ghost h-11 px-5">
              Read Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

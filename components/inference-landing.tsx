"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { AgentInfo, JobRequestInfo } from "@/lib/constants"
import { formatRating } from "@/lib/utils"
import { LiveBlock } from "@/components/live-block"
import { AgentAvatar } from "@/components/agent-avatar"
import { useT } from "@/lib/i18n/context"

interface Props {
  agents: AgentInfo[]
  jobs: JobRequestInfo[]
  onchain: boolean
  chainInfo: { block: bigint; chainId: number } | null
}

export function InferenceLanding({ agents, jobs, onchain, chainInfo }: Props) {
  const t = useT()
  const openJobs = jobs.filter((j) => j.status === "OPEN").length
  const completed = jobs.filter((j) => j.status === "COMPLETED").length
  const initialBlock = chainInfo ? Number(chainInfo.block) : 0

  return (
    <div>
      <section className="border-b border-border">
        <div className="inf-container py-16 sm:py-20 lg:py-24">
          <p className="inf-eyebrow mb-4">{t.landing.eyebrow}</p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {t.landing.title}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t.landing.body}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <Link href="/integrate" className="inf-btn inf-btn-primary h-9 px-4">
              {t.landing.ctaMcp}
            </Link>
            <Link href="/jobs" className="inf-btn inf-btn-ghost h-9 px-4">
              {t.landing.ctaTasks}
            </Link>
            <Link href="/tutorial" className="inf-btn inf-btn-ghost h-9 px-4 text-muted-foreground">
              {t.landing.ctaTutorial}
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${onchain ? "bg-primary shadow-[0_0_8px_#bff009]" : "bg-muted-foreground"}`}
              />
              {onchain ? t.landing.live : t.landing.offline}
            </span>
            {chainInfo && <span>chain {chainInfo.chainId}</span>}
            <LiveBlock initialBlock={initialBlock} variant="inline" />
            <span className="tabular-nums">
              {agents.length} {t.landing.agents.toLowerCase()}
            </span>
            <span className="tabular-nums">
              {jobs.length} {t.landing.tasks.toLowerCase()}
            </span>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="inf-container grid grid-cols-2 gap-px bg-border-sm:grid-cols-4">
          {[
            { label: t.landing.agents, value: agents.length },
            { label: t.landing.tasks, value: jobs.length },
            { label: t.landing.open, value: openJobs },
            { label: t.landing.done, value: completed },
          ].map((s) => (
            <div key={s.label} className="bg-background px-4 py-5">
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="agents" className="border-b border-border">
        <div className="inf-container py-12 sm:py-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{t.landing.agentsTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.landing.agentsSub}</p>
            </div>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              {t.landing.allAgents}
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.slice(0, 6).map((a) => (
              <Link
                key={a.id}
                href={`/agents/${a.id}`}
                className="group flex gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-card-hover"
              >
                <AgentAvatar
                  name={a.name}
                  id={a.id}
                  contractAddress={a.contractAddress}
                  avatarUrl={a.avatarUrl}
                  size="sm"
                  className="rounded-md border border-border bg-muted text-muted-foreground"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {a.description || "On chain agent"}
                  </p>
                  <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
                    {formatRating(a.avgRating)} · {a.jobCount} {t.landing.jobs}
                  </p>
                </div>
              </Link>
            ))}
            {agents.length === 0 && (
              <div className="col-span-full rounded-lg border border-border-dashed border border-border px-6 py-12 text-center text-sm text-muted-foreground">
                {t.landing.noAgents}{" "}
                <Link href="/create" className="text-foreground underline-offset-4 hover:underline">
                  {t.landing.createOne}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="inf-container py-12 sm:py-16">
          <h2 className="mb-6 text-lg font-semibold tracking-tight">{t.landing.startTitle}</h2>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border-sm:grid-cols-3">
            {[
              { href: "/integrate", title: t.landing.integrateTitle, body: t.landing.integrateBody },
              { href: "/jobs", title: t.landing.tasksTitle, body: t.landing.tasksBody },
              { href: "/tutorial", title: t.landing.tutorialTitle, body: t.landing.tutorialBody },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col bg-background p-5 transition-colors hover:bg-card-hover"
              >
                <span className="inline-flex items-center gap-1 text-sm font-medium">
                  {item.title}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="mt-1.5 text-sm text-muted-foreground">{item.body}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {agents.length > 0 && (
        <section className="border-b border-border">
          <div className="inf-container py-12 sm:py-16">
            <h2 className="mb-6 text-lg font-semibold tracking-tight">{t.landing.leaderboard}</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">{t.landing.agents}</th>
                    <th className="px-4 py-2.5 font-medium">{t.landing.jobs}</th>
                    <th className="px-4 py-2.5 font-medium">{t.landing.rating}</th>
                    <th className="hidden px-4 py-2.5 font-medium sm:table-cell">{t.nav.skills}</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {agents.slice(0, 8).map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-card-hover">
                      <td className="px-4 py-2.5 font-medium">{a.name}</td>
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{a.jobCount}</td>
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                        {formatRating(a.avgRating)}
                      </td>
                      <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                        {a.skills.length || "·"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/agents/${a.id}`}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {t.landing.view}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="inf-container py-14 text-center sm:py-16">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t.landing.readyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t.landing.readyBody}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <Link href="/dashboard" className="inf-btn inf-btn-primary h-9 px-4">
              {t.landing.dashboard}
            </Link>
            <Link href="/docs" className="inf-btn inf-btn-ghost h-9 px-4">
              {t.nav.docs}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

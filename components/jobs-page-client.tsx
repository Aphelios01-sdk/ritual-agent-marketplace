"use client"

import Link from "next/link"
import { ArrowLeft, ListTodo, Bot, Layers } from "lucide-react"
import { JobsBoard } from "@/components/jobs-board"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LayerRail } from "@/components/layer-rail"
import { isJobExpired, type OnchainJob } from "@/lib/onchain"
import { useLiveBlock } from "@/hooks/use-live-block"
import { useT } from "@/lib/i18n/context"

export function JobsPageClient({ jobs }: { jobs: OnchainJob[] }) {
  const t = useT()
  const live = useLiveBlock(0, 4_000)
  const head = live.block > 0 ? BigInt(live.block) : BigInt(0)
  const open = jobs.filter((j) => j.status === "OPEN" && !isJobExpired(j, head)).length
  const active = jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length
  const done = jobs.filter((j) => j.status === "COMPLETED").length

  return (
    <div className="min-h-[100dvh]">
      <LayerRail activeId="matching" />
      <section className="page-container py-8 md:py-14">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> {t.common.back}
        </Link>
        <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="max-w-[60ch]">
            <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              <Layers className="h-3 w-3" /> {t.jobs.eyebrow}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-[2.6rem] md:leading-[1.05]">
              {t.jobs.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.jobs.body}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:flex-wrap lg:flex">
            <Button asChild className="h-11 gap-1.5 rounded-full sm:h-10">
              <Link href="/join/user">
                <ListTodo className="h-4 w-4" /> {t.jobs.postAsUser}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 gap-1.5 rounded-full sm:h-10">
              <Link href="/join/asp">
                <Bot className="h-4 w-4" /> {t.jobs.bidAsAsp}
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-3">
          {[
            { label: t.jobs.openForBids, value: open },
            { label: t.jobs.inFlight, value: active },
            { label: t.jobs.completed, value: done },
          ].map((s) => (
            <Card key={s.label} className="border border-border/60 bg-card shadow-none">
              <CardContent className="p-4">
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {open === 0 && active === 0 && done === 0 && (
          <Card className="mb-6 border-dashed border-border/60 bg-card/30">
            <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{t.jobs.quiet}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.jobs.quietBody}</p>
              </div>
              <Button asChild className="shrink-0 rounded-full">
                <Link href="#board">{t.jobs.scrollPost}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div id="board">
          <JobsBoard jobs={jobs} />
        </div>
      </section>
    </div>
  )
}

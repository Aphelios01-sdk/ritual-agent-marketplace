import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ListTodo, Bot, Layers } from "lucide-react"
import { JobsBoard } from "@/components/jobs-board"
import { fetchJobs } from "@/lib/onchain"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LayerRail } from "@/components/layer-rail"

export const metadata: Metadata = {
  title: "Tasks",
  description:
    "Task marketplace on Ritual Chain: post jobs, bid with skills, earn escrowed RIT. Live open / active / done board.",
}

export const dynamic = "force-dynamic"

export default async function JobsPage() {
  const jobs = await fetchJobs({ fresh: true })
  const open = jobs.filter((j) => j.status === "OPEN").length
  const active = jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length
  const done = jobs.filter((j) => j.status === "COMPLETED").length

  return (
    <div className="min-h-[100dvh]">
      <LayerRail activeId="matching" />
      <section className="container mx-auto max-w-[1400px] px-4 py-10 md:py-14">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[60ch] animate-fade-up">
            <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              <Layers className="h-3 w-3" /> L3 Matching, tasks market: post, bid, earn
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">Tasks</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Open jobs from anyone. Post what you need and let agents come to you, or browse and bid where you can deliver.
              Rewards settle via on-chain escrow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-full gap-1.5">
              <Link href="/join/user">
                <ListTodo className="h-4 w-4" /> Post as User
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full gap-1.5">
              <Link href="/join/asp">
                <Bot className="h-4 w-4" /> Bid as ASP
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Open for bids", value: open },
            { label: "In flight", value: active },
            { label: "Completed", value: done },
          ].map((s) => (
            <Card key={s.label} className="surface-card border-border/60">
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
                <p className="text-sm font-medium">Market is quiet</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Open, active, and done are all zero. Post a task with a RIT reward to start the pipeline.
                </p>
              </div>
              <Button asChild className="shrink-0 rounded-full">
                <Link href="#board">Scroll to post form</Link>
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

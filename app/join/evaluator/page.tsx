import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CONTRACT_ADDRESSES } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Become an Evaluator",
}

const STEPS = [
  "Stake bond so you can participate in dispute resolution.",
  "Watch disputed jobs on the Disputes board.",
  "Vote with DisputeCouncil when panels form.",
  "Correct votes earn; incorrect risk slash. Keep the market honest.",
]

export default function JoinEvaluatorPage() {
  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[900px] px-4 py-10 md:py-14">
        <Link href="/join" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All roles
        </Link>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Role: Evaluator</p>
        <h1 className="text-3xl font-bold tracking-tight">Arbitrate disputed tasks</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Stake, vote, and secure the marketplace. DisputeCouncil + AgentStaking keep outcomes slashable and fair.
        </p>

        <Card className="surface-card mt-8 border-border/60">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">Step-by-step</h2>
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}. </span>
                    {s}
                  </span>
                </li>
              ))}
            </ol>
            <div className="rounded-lg border border-border/60 bg-background/50 p-3 font-mono text-[11px] text-muted-foreground">
              DisputeCouncil: {CONTRACT_ADDRESSES.disputeCouncil}
              <br />
              AgentStaking: {CONTRACT_ADDRESSES.agentStaking}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-full gap-1.5">
            <Link href="/disputes">
              Open disputes board <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/docs">Security & audit notes</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

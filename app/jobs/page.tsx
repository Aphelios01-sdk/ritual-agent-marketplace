import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { JobsBoard } from "@/components/jobs-board"
import { fetchJobs } from "@/lib/onchain"
import { type OnchainJob } from "@/lib/onchain"

export const metadata: Metadata = {
  title: "Jobs · Prompt Market",
}

export const dynamic = "force-dynamic"

export default async function JobsPage() {
  const jobs = await fetchJobs()
  const isMock = false // single source of truth: on-chain only

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[1400px] px-4 py-10 md:py-14">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-8 max-w-[60ch] animate-fade-up">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Marketplace</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">Jobs</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Live job board. Post a prompt-driven job with a RITUAL reward held in escrow, and agents bid to fulfill it.
          </p>
        </div>
        <JobsBoard jobs={jobs} isMock={isMock} />
      </section>
    </div>
  )
}

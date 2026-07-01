import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { JobsBoard } from "@/components/jobs-board"
import { fetchJobs } from "@/lib/onchain"
import { MOCK_JOB_REQUESTS, JOB_STATUS } from "@/lib/constants"
import { type OnchainJob } from "@/lib/onchain"

export const metadata: Metadata = {
  title: "Jobs · Prompt Market",
}

// Always read fresh on-chain state.
export const dynamic = "force-dynamic"

// Adapt mock jobs to the OnchainJob shape so the board can render them as a fallback.
const MOCK_AS_ONCHAIN: OnchainJob[] = MOCK_JOB_REQUESTS.map((j) => ({
  id: j.id,
  requester: j.requester,
  provider: j.provider,
  reward: j.reward,
  bondRequired: BigInt(0),
  status: j.status,
  statusRaw: Object.keys(JOB_STATUS).indexOf(j.status),
  deadline: BigInt(0),
  taskData: (() => {
    try {
      return JSON.stringify(JSON.parse(j.taskData))
    } catch {
      return j.taskData
    }
  })(),
  resultData: j.resultData,
}))

export default async function JobsPage() {
  const onchainJobs = await fetchJobs()
  const isMock = onchainJobs.length === 0
  const jobs = isMock ? MOCK_AS_ONCHAIN : onchainJobs

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
            {isMock && " Showing mock data (no on-chain jobs yet or RPC unreachable)."}
          </p>
        </div>
        <JobsBoard jobs={jobs} isMock={isMock} />
      </section>
    </div>
  )
}

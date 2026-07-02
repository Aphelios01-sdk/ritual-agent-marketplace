import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { JobDetail } from "@/components/job-detail"
import { fetchJob, fetchBids, type OnchainJob, type OnchainBid } from "@/lib/onchain"
import { MOCK_JOB_REQUESTS } from "@/lib/constants"

export const metadata: Metadata = { title: "Job · Prompt Market" }
export const dynamic = "force-dynamic"

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const onchainJob = await fetchJob(id)
  const bids = await fetchBids(id)

  // Fallback to mock if not on-chain.
  let job: OnchainJob | null = onchainJob
  if (!job) {
    const mock = MOCK_JOB_REQUESTS.find((j) => j.id === id)
    if (mock) {
      job = {
        id: mock.id,
        requester: mock.requester,
        provider: mock.provider,
        reward: mock.reward,
        bondRequired: BigInt(0),
        status: mock.status,
        statusRaw: 0,
        deadline: BigInt(0),
        taskData: mock.taskData,
        resultData: mock.resultData,
      }
    }
  }

  if (!job) notFound()

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[1100px] px-4 py-10 md:py-14">
        <Link href="/jobs" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <JobDetail job={job as OnchainJob} bids={bids} isMock={!onchainJob} />
      </section>
    </div>
  )
}

// Re-export types for the client component boundary (kept here to avoid circular imports).
export type { OnchainJob, OnchainBid }

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { JobDetail } from "@/components/job-detail"
import { fetchJob, fetchBids, type OnchainJob, type OnchainBid } from "@/lib/onchain"
import { formatRitual, shortAddress, isZeroAddress } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const job = await fetchJob(id)
    if (!job) {
      return { title: `Job #${id}`, description: "Job not found on Ritual Agentry." }
    }
    const task = (job.taskData || "On chain job").slice(0, 120)
    const provider = isZeroAddress(job.provider)
      ? "awaiting provider"
      : shortAddress(job.provider)
    return {
      title: `Job #${id} · ${formatRitual(job.reward)}`,
      description: `${task}. Requester ${shortAddress(job.requester)}, ${provider}, status ${job.status}.`,
      openGraph: {
        title: `Job #${id} · ${formatRitual(job.reward)} · Ritual Agentry`,
        description: task,
      },
    }
  } catch {
    return { title: `Job #${id}` }
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await fetchJob(id)
  const bids = await fetchBids(id)

  if (!job) notFound()

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[1100px] px-4 py-10 md:py-14">
        <Link
          href="/jobs"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <JobDetail job={job} bids={bids} isMock={false} />
      </section>
    </div>
  )
}

export type { OnchainJob, OnchainBid }

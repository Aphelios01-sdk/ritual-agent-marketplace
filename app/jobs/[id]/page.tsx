import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { JobDetail } from "@/components/job-detail"
import { fetchJob, fetchBids, type OnchainJob, type OnchainBid } from "@/lib/onchain"

export const metadata: Metadata = { title: "Job | Prompt Market" }
export const revalidate = 8

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await fetchJob(id)
  const bids = await fetchBids(id)

  if (!job) notFound()

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[1100px] px-4 py-10 md:py-14">
        <Link href="/jobs" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <JobDetail job={job} bids={bids} isMock={false} />
      </section>
    </div>
  )
}

// Re-export types for the client component boundary (kept here to avoid circular imports).
export type { OnchainJob, OnchainBid }

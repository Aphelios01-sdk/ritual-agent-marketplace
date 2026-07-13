import type { Metadata } from "next"
import { AnalyticsPageClient } from "@/components/analytics-page-client"
import { fetchAgents, fetchJobs, fetchChainInfo } from "@/lib/onchain"
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Analytics",
  description: "Network analytics for Ritual Agentry agents, jobs, and escrow on Ritual Chain.",
}
export const revalidate = 8

export default async function AnalyticsPage() {
  const [agents, jobs, chainInfo] = await Promise.all([
    fetchAgents(),
    fetchJobs(),
    fetchChainInfo(),
  ])

  const activeAgents = agents.filter((a) => a.active).length
  const verified = agents.filter((a) => a.jobCount >= 10 && a.avgRating >= 4).length
  const totalJobs = jobs.length
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length
  const failedJobs = jobs.filter(
    (j) => j.status === "DISPUTED" || j.status === "REFUNDED" || j.status === "CANCELLED",
  ).length
  const totalRevenue = jobs.reduce((s, j) => s + j.reward, BigInt(0))
  const totalBond = agents.reduce((s, a) => s + a.bondAmount, BigInt(0))
  const avgRating = agents.length ? agents.reduce((s, a) => s + a.avgRating, 0) / agents.length : 0
  const successRate = jobs.length ? Math.round((completedJobs / jobs.length) * 100) : 0

  const byStatus = (Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((st) => ({
    status: st,
    count: jobs.filter((j) => j.status === st).length,
  }))

  const topAgents = [...agents]
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 6)
    .map((a) => ({
      id: String(a.id),
      name: a.name,
      avgRating: a.avgRating,
      jobCount: a.jobCount,
    }))

  return (
    <AnalyticsPageClient
      data={{
        activeAgents,
        verified,
        totalJobs,
        completedJobs,
        failedJobs,
        totalRevenue: Number(totalRevenue) / 1e18,
        totalBond: Number(totalBond) / 1e18,
        avgRating,
        successRate,
        byStatus,
        topAgents,
        initialBlock: chainInfo ? Number(chainInfo.block) : 0,
      }}
    />
  )
}

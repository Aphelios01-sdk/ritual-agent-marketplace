import type { Metadata } from "next"
import { InferenceDashboard } from "@/components/inference-dashboard"
import { fetchAgents, fetchJobs, fetchChainInfo } from "@/lib/onchain"
import type { JobRequestInfo } from "@/lib/constants"
import type { OnchainJob } from "@/lib/onchain"

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Production console for Ritual Agentry: live agents, open tasks, pipeline, and on chain activity on Ritual Chain.",
  alternates: {
    canonical: "https://ritual-agentry.vercel.app/dashboard",
  },
}

export const revalidate = 8

function toJob(job: OnchainJob): JobRequestInfo {
  return {
    id: job.id,
    requester: job.requester,
    requiredSkillIds: [],
    taskData: job.taskData,
    reward: job.reward,
    status: job.status,
    provider: job.provider,
    resultData: job.resultData,
    rating: 0,
    deadline: job.deadline,
  }
}

export default async function DashboardPage() {
  const [agents, jobs, chainInfo] = await Promise.all([
    fetchAgents(),
    fetchJobs(),
    fetchChainInfo(),
  ])

  return (
    <InferenceDashboard
      agents={agents}
      jobs={jobs.map(toJob)}
      chainInfo={chainInfo}
      onchain={agents.length > 0 || chainInfo != null}
    />
  )
}

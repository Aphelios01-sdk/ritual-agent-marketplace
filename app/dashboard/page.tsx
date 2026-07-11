import type { Metadata } from "next"
import { InferenceDashboard } from "@/components/inference-dashboard"
import { fetchAgents, fetchJobs, fetchChainInfo } from "@/lib/onchain"
import type { JobRequestInfo } from "@/lib/constants"
import type { OnchainJob } from "@/lib/onchain"

export const metadata: Metadata = {
  title: "Dashboard | Prompt Market",
  description: "Inference-style console for the Prompt Market agent economy on Ritual Chain.",
}

export const dynamic = "force-dynamic"

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

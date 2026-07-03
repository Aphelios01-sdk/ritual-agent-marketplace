import { AgentExplorer } from "@/components/agent-explorer"
import { fetchAgents, fetchJobs, fetchChainInfo } from "@/lib/onchain"
import type { JobRequestInfo } from "@/lib/constants"
import { type OnchainJob } from "@/lib/onchain"

export const dynamic = "force-dynamic"

function toJobRequestInfo(job: OnchainJob): JobRequestInfo {
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

export default async function Home() {
  const [onchainAgents, onchainJobs, chainInfo] = await Promise.all([
    fetchAgents(),
    fetchJobs(),
    fetchChainInfo(),
  ])
  const onchain = onchainAgents.length > 0
  const agents = onchainAgents
  const jobs: JobRequestInfo[] = onchainJobs.map(toJobRequestInfo)

  return <AgentExplorer agents={agents} onchain={onchain} chainInfo={chainInfo} jobs={jobs} />
}

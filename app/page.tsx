import { AgentExplorer } from "@/components/agent-explorer"
import { fetchAgents, fetchJobs, fetchChainInfo } from "@/lib/onchain"
import { MOCK_AGENTS, MOCK_JOB_REQUESTS } from "@/lib/constants"
import type { JobRequestInfo } from "@/lib/constants"
import { type OnchainJob } from "@/lib/onchain"

// ponytail: force dynamic — read fresh on-chain state every request (no static cache)
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
  const agents = onchain ? onchainAgents : MOCK_AGENTS
  // Activity feed reads from on-chain jobs when available, else mock
  const jobs: JobRequestInfo[] = onchainJobs.length > 0
    ? onchainJobs.map(toJobRequestInfo)
    : MOCK_JOB_REQUESTS

  return <AgentExplorer agents={agents} onchain={onchain} chainInfo={chainInfo} jobs={jobs} />
}

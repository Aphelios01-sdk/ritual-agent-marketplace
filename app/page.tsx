import { InferenceLanding } from "@/components/inference-landing"
import { fetchAgents, fetchJobs, fetchChainInfo } from "@/lib/onchain"
import type { JobRequestInfo } from "@/lib/constants"
import type { OnchainJob } from "@/lib/onchain"

export const revalidate = 8

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

  return (
    <InferenceLanding
      agents={onchainAgents}
      jobs={onchainJobs.map(toJobRequestInfo)}
      onchain={onchainAgents.length > 0 || chainInfo != null}
      chainInfo={chainInfo}
    />
  )
}

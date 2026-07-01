import { AgentExplorer } from "@/components/agent-explorer"
import { fetchAgents, fetchChainInfo } from "@/lib/onchain"
import { MOCK_AGENTS, MOCK_JOB_REQUESTS } from "@/lib/constants"

// ponytail: force dynamic — read fresh on-chain state every request (no static cache)
export const dynamic = "force-dynamic"

export default async function Home() {
  const [onchainAgents, chainInfo] = await Promise.all([fetchAgents(), fetchChainInfo()])
  const onchain = onchainAgents.length > 0
  const agents = onchain ? onchainAgents : MOCK_AGENTS

  return <AgentExplorer agents={agents} onchain={onchain} chainInfo={chainInfo} jobs={MOCK_JOB_REQUESTS} />
}

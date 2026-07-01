import { AgentExplorer } from "@/components/agent-explorer"
import { fetchAgents } from "@/lib/onchain"
import { MOCK_AGENTS } from "@/lib/constants"

// ponytail: force dynamic — read fresh on-chain state every request (no static cache)
export const dynamic = "force-dynamic"

export default async function Home() {
  const onchainAgents = await fetchAgents()
  const onchain = onchainAgents.length > 0
  const agents = onchain ? onchainAgents : MOCK_AGENTS

  return <AgentExplorer agents={agents} onchain={onchain} />
}

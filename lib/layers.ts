import { CONTRACT_ADDRESSES, PRECOMPILE_ADDRESSES } from "./constants"

export type LayerId = "protocol" | "identity" | "discovery" | "matching" | "execution" | "settlement" | "governance"

export interface MarketLayer {
  id: LayerId
  level: number
  name: string
  short: string
  tagline: string
  description: string
  status: "live" | "ready" | "beta"
  color: "primary" | "blue" | "green" | "yellow" | "red" | "violet"
  contracts: { label: string; address: string }[]
  routes: { href: string; label: string }[]
  flows: string[]
  inputs: string[]
  outputs: string[]
}

export const MARKET_LAYERS: MarketLayer[] = [
  {
    id: "protocol",
    level: 0,
    name: "Protocol",
    short: "L0",
    tagline: "Ritual Chain + precompiles",
    description:
      "Base settlement chain and native compute. HTTP fetch (0x0801) and LLM inference (0x0802) run as precompiles so agents can call the outside world without off-chain middlemen.",
    status: "live",
    color: "blue",
    contracts: [
      { label: "Chain", address: "Ritual 1979" },
      { label: "HTTP precompile", address: PRECOMPILE_ADDRESSES.http },
      { label: "LLM precompile", address: PRECOMPILE_ADDRESSES.llm },
      { label: "Scheduler", address: PRECOMPILE_ADDRESSES.scheduler },
    ],
    routes: [
      { href: "/docs", label: "Docs" },
      { href: "/analytics", label: "Network analytics" },
    ],
    flows: ["Block production", "Precompile calls", "Gas in RITUAL"],
    inputs: ["RPC", "Signed txs"],
    outputs: ["Receipts", "Precompile results"],
  },
  {
    id: "identity",
    level: 1,
    name: "Identity",
    short: "L1",
    tagline: "Agents, skills, reputation",
    description:
      "Who an agent is. Registry binds name, contract, skills, and ratings. Factory deploys agent contracts; directory + reputation carry profile across jobs.",
    status: "live",
    color: "primary",
    contracts: [
      { label: "AgentRegistry", address: CONTRACT_ADDRESSES.agentRegistry },
      { label: "AgentFactory", address: CONTRACT_ADDRESSES.agentFactory },
      { label: "AgentReputation", address: CONTRACT_ADDRESSES.agentReputation },
      { label: "AgentDirectory", address: CONTRACT_ADDRESSES.agentDirectory },
    ],
    routes: [
      { href: "/create", label: "Create agent" },
      { href: "/#discover", label: "Browse agents" },
      { href: "/join/asp", label: "Become ASP" },
    ],
    flows: ["registerAgent", "setSkills", "createAgent", "recordReview"],
    inputs: ["Name, skills, wallet"],
    outputs: ["Agent ID, rep score"],
  },
  {
    id: "discovery",
    level: 2,
    name: "Discovery",
    short: "L2",
    tagline: "Find agents & skill catalogs",
    description:
      "Surface supply. Search, filter by HTTP/LLM skills, sort by bond/rating/earnings. Skill catalog exposes copy-paste install snippets.",
    status: "live",
    color: "violet",
    contracts: [
      { label: "AgentDirectory", address: CONTRACT_ADDRESSES.agentDirectory },
      { label: "JobTemplates", address: CONTRACT_ADDRESSES.jobTemplates },
    ],
    routes: [
      { href: "/#discover", label: "Agent market" },
      { href: "/skills", label: "Skill catalog" },
      { href: "/analytics", label: "Top agents" },
    ],
    flows: ["Search", "Filter", "Featured strip", "Templates"],
    inputs: ["Query, skill tags"],
    outputs: ["Agent shortlist"],
  },
  {
    id: "matching",
    level: 3,
    name: "Matching",
    short: "L3",
    tagline: "Tasks, bids, assignment",
    description:
      "Demand meets supply. Requesters post jobs; staked live agents with matching skills bid; requesters assign. Bulk batcher and templates accelerate volume.",
    status: "live",
    color: "yellow",
    contracts: [
      { label: "JobMarketV2", address: CONTRACT_ADDRESSES.jobMarketV2 },
      { label: "JobMarket", address: CONTRACT_ADDRESSES.jobMarket },
      { label: "BulkJobBatcher", address: CONTRACT_ADDRESSES.bulkJobBatcher },
      { label: "JobTemplates", address: CONTRACT_ADDRESSES.jobTemplates },
    ],
    routes: [
      { href: "/jobs", label: "Tasks board" },
      { href: "/join/user", label: "Post as User" },
      { href: "/join/asp", label: "Bid as ASP" },
    ],
    flows: ["requestService", "submitBid", "assignJob", "getAvailableJobs"],
    inputs: ["Skill IDs, reward, task data"],
    outputs: ["Job ID, bid set, assignment"],
  },
  {
    id: "execution",
    level: 4,
    name: "Execution",
    short: "L4",
    tagline: "Run skills, heartbeat, hooks",
    description:
      "Do the work. Providers start processing with bond, call HTTP/LLM skills, submit results. Heartbeat proves liveness; webhooks and subcontractors extend pipelines.",
    status: "live",
    color: "green",
    contracts: [
      { label: "AgentHeartbeat", address: CONTRACT_ADDRESSES.agentHeartbeat },
      { label: "AgentSubcontractor", address: CONTRACT_ADDRESSES.agentSubcontractor },
      { label: "WebhookRegistry", address: CONTRACT_ADDRESSES.webhookRegistry },
      { label: "SubscriptionManager", address: CONTRACT_ADDRESSES.subscriptionManager },
    ],
    routes: [
      { href: "/skills", label: "Skills" },
      { href: "/jobs", label: "Active jobs" },
      { href: "/docs", label: "Bootstrap SDK" },
    ],
    flows: ["startProcessing", "submitResult", "ping", "subcontract"],
    inputs: ["Assigned job, skill config"],
    outputs: ["Result bytes, liveness"],
  },
  {
    id: "settlement",
    level: 5,
    name: "Settlement",
    short: "L5",
    tagline: "Escrow, bond, payouts",
    description:
      "Money moves only with rules. Rewards lock in escrow; bonds slash on failure; completion releases funds to providers and records earnings on the registry.",
    status: "live",
    color: "primary",
    contracts: [
      { label: "JobMarketV2 escrow", address: CONTRACT_ADDRESSES.jobMarketV2 },
      { label: "AgentStaking", address: CONTRACT_ADDRESSES.agentStaking },
    ],
    routes: [
      { href: "/jobs", label: "Escrow status" },
      { href: "/analytics", label: "Revenue stats" },
      { href: "/docs", label: "Fee model" },
    ],
    flows: ["escrow lock", "stake / slash", "payout", "rateProvider"],
    inputs: ["Reward, bond"],
    outputs: ["RITUAL transfer, ratings"],
  },
  {
    id: "governance",
    level: 6,
    name: "Governance",
    short: "L6",
    tagline: "Disputes & evaluators",
    description:
      "When parties disagree, staked evaluators vote. DisputeCouncil panels resolve refund vs payout; wrong votes risk slash so the market stays honest.",
    status: "ready",
    color: "red",
    contracts: [
      { label: "DisputeCouncil", address: CONTRACT_ADDRESSES.disputeCouncil },
      { label: "AgentStaking", address: CONTRACT_ADDRESSES.agentStaking },
    ],
    routes: [
      { href: "/disputes", label: "Disputes board" },
      { href: "/join/evaluator", label: "Become evaluator" },
    ],
    flows: ["dispute", "panel vote", "slash / release"],
    inputs: ["Disputed job, votes"],
    outputs: ["Final status, slash events"],
  },
]

export const LAYER_MAP = Object.fromEntries(MARKET_LAYERS.map((l) => [l.id, l])) as Record<LayerId, MarketLayer>

export function getLayer(id: string): MarketLayer | undefined {
  return MARKET_LAYERS.find((l) => l.id === id)
}

export function adjacentLayers(id: LayerId): { prev?: MarketLayer; next?: MarketLayer } {
  const i = MARKET_LAYERS.findIndex((l) => l.id === id)
  return {
    prev: i > 0 ? MARKET_LAYERS[i - 1] : undefined,
    next: i >= 0 && i < MARKET_LAYERS.length - 1 ? MARKET_LAYERS[i + 1] : undefined,
  }
}

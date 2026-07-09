export const RITUAL_CHAIN = {
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ritualfoundation.org"] },
  },
  blockExplorers: {
    default: { name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org" },
  },
} as const

// Deployed 2026-07-09 via script/DeployEverything.s.sol
// Owner (all ownable): 0x16Cf405F68414b48819e344d1FbeccE297685082
export const CONTRACT_ADDRESSES = {
  agentRegistry: "0x058756c754CAD054571933be57E3AADD3c3660F4" as const,
  jobMarket: "0xe12075d1968EB7765f299da0D70cafE4864519C1" as const,
  jobMarketV2: "0x34779E2Bc1B1f975Ca8c947515013412b30Cb020" as const,
  agentFactory: "0xE1A3b0926413b2C9a20CA4dBF359a4e347ba99C9" as const,
  agentStaking: "0xdF186d42Ffe22246dB6FaE8d3E6AB29735ecfF18" as const,
  agentHeartbeat: "0x157802f666233ffd2723b0596fa89824D1aea5aB" as const,
  agentReputation: "0xFd443aA2E2cDa738586948430642CCd4Afd7D195" as const,
  agentDirectory: "0x539753c8E5f3b69ecD3171B2bBFe46150294eaa2" as const,
  jobTemplates: "0xA07B029A8C1D640485FF7C6b8D17D4b6cc2e5275" as const,
  disputeCouncil: "0xBCD900214234fDeCe9Edc689edc7D0317748e9B4" as const,
  agentSubcontractor: "0xaB64ffa698763700A4361e1bcbff0E3202F449eE" as const,
  subscriptionManager: "0x6C22349FE4edB9f1Bc4ea6f29F07D8116c026847" as const,
  bulkJobBatcher: "0xc8146A8365Fd7082c9cfC015a301de9Bd80E394D" as const,
  webhookRegistry: "0xe7AF6A9e0D3864Cda72703f67e07Ac8A06BAB189" as const,
}

export const PRECOMPILE_ADDRESSES = {
  http: "0x0000000000000000000000000000000000000801" as const,
  llm: "0x0000000000000000000000000000000000000802" as const,
  ritualWallet: "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948" as const,
  asyncDelivery: "0x5A16214fF555848411544b005f7Ac063742f39F6" as const,
  agentHeartbeat: "0xEF505E801f1Db392B5289690E2ffc20e840A3aCa" as const,
  scheduler: "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B" as const,
}

// ── Skill Definitions ──

export interface SkillDefinition {
  skillId: `0x${string}`
  name: string
  description: string
  precompileType: "HTTP" | "LLM"
  config: Record<string, string>
  active: boolean
  source: "official" | "community"
  author?: string
  authorUrl?: string
}

const OFFICIAL_SKILLS: SkillDefinition[] = [
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000001" as const,
    name: "fetch-token-price",
    description: "Fetch real-time token price from CoinGecko",
    precompileType: "HTTP",
    config: { url: "https://api.coingecko.com/api/v3/simple/price", method: "GET", headers: "{}" },
    active: true,
    source: "official",
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000002" as const,
    name: "sentiment-analysis",
    description: "Analyze sentiment of text data using LLM",
    precompileType: "LLM",
    config: { promptTemplate: "Analyze the sentiment of this text: {input}", model: "zai-org/GLM-4.7-FP8" },
    active: true,
    source: "official",
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000003" as const,
    name: "defi-report",
    description: "Generate structured DeFi report from market data",
    precompileType: "LLM",
    config: { promptTemplate: "Generate a DeFi report based on this data: {input}", model: "zai-org/GLM-4.7-FP8" },
    active: true,
    source: "official",
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000004" as const,
    name: "fetch-onchain-data",
    description: "Fetch on-chain data from a given address or contract",
    precompileType: "HTTP",
    config: { url: "https://explorer.ritualfoundation.org/api", method: "GET", headers: "{}" },
    active: true,
    source: "official",
  },
]

export const COMMUNITY_SKILLS: SkillDefinition[] = [
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000011" as const,
    name: "twitter-sentiment",
    description: "Fetch recent tweets for a keyword and analyze sentiment via LLM",
    precompileType: "HTTP",
    config: { url: "https://api.twitter.com/2/tweets/search/recent", method: "GET", headers: "{}" },
    active: true,
    source: "official",
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000012" as const,
    name: "price-alert",
    description: "Monitor token price against a threshold and trigger alert if crossed",
    precompileType: "HTTP",
    config: { url: "https://api.coingecko.com/api/v3/simple/price", method: "GET", headers: "{}" },
    active: true,
    source: "official",
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000013" as const,
    name: "nft-metadata",
    description: "Fetch NFT metadata (name, image, traits) from any contract address",
    precompileType: "HTTP",
    config: { url: "https://api.opensea.io/api/v2/chain/ethereum/contract/{address}/nfts", method: "GET", headers: "{}" },
    active: true,
    source: "official",
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000014" as const,
    name: "code-review",
    description: "Automated code review — submit source code and receive LLM-powered feedback",
    precompileType: "LLM",
    config: { promptTemplate: "Review the following code for bugs, security issues, and style: {input}", model: "zai-org/GLM-4.7-FP8" },
    active: true,
    source: "official",
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000015" as const,
    name: "translate-text",
    description: "Translate text between 50+ languages using LLM",
    precompileType: "LLM",
    config: { promptTemplate: "Translate the following text to {targetLang}: {input}", model: "zai-org/GLM-4.7-FP8" },
    active: true,
    source: "official",
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000016" as const,
    name: "summarize-article",
    description: "Summarize articles, docs, or long text into concise bullet points",
    precompileType: "LLM",
    config: { promptTemplate: "Summarize this article in 3-5 bullet points: {input}", model: "zai-org/GLM-4.7-FP8" },
    active: true,
    source: "official",
  },
]

export const BUILT_IN_SKILLS: SkillDefinition[] = [...OFFICIAL_SKILLS, ...COMMUNITY_SKILLS]

export const SKILL_MAP = Object.fromEntries(BUILT_IN_SKILLS.map((s) => [s.skillId, s])) as Record<string, SkillDefinition>

// ── Agent Data Model ──

export interface AgentInfo {
  id: string
  name: string
  description: string
  contractAddress: `0x${string}`
  skills: SkillDefinition[]
  bondAmount: bigint
  totalEarnings: bigint
  avgRating: number
  jobCount: number
  active: boolean
}

export interface JobRequestInfo {
  id: string
  requester: `0x${string}`
  requiredSkillIds: `0x${string}`[]
  taskData: string
  reward: bigint
  status: JobStatus
  provider: `0x${string}`
  resultData: string
  rating: number
}

export const JOB_STATUS = {
  OPEN: "OPEN",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  DISPUTED: "DISPUTED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS]

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  OPEN: "text-yellow-500",
  ASSIGNED: "text-blue-500",
  IN_PROGRESS: "text-blue-500",
  COMPLETED: "text-green-500",
  DISPUTED: "text-red-500",
  REFUNDED: "text-gray-500",
  CANCELLED: "text-gray-400",
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  OPEN: "Open for Bids",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
}

// ── Mock Agents ──

export const MOCK_AGENTS: AgentInfo[] = [
  {
    id: "1",
    name: "Crypto Sentiment Bot",
    description: "Analyzes crypto market sentiment using HTTP fetch + LLM analysis. Provides a daily sentiment summary.",
    contractAddress: "0x0000000000000000000000000000000000000001",
    skills: [BUILT_IN_SKILLS[0], BUILT_IN_SKILLS[1]],
    bondAmount: BigInt("100000000000000000000"), // 100 RITUAL
    totalEarnings: BigInt("500000000000000000000"),
    avgRating: 4.5,
    jobCount: 128,
    active: true,
  },
  {
    id: "2",
    name: "Token Price Oracle",
    description: "Fetches real-time token prices from CoinGecko & DexScreener via the HTTP precompile. Returns structured data.",
    contractAddress: "0x0000000000000000000000000000000000000002",
    skills: [BUILT_IN_SKILLS[0]],
    bondAmount: BigInt("50000000000000000000"), // 50 RITUAL
    totalEarnings: BigInt("300000000000000000000"),
    avgRating: 4.2,
    jobCount: 95,
    active: true,
  },
  {
    id: "3",
    name: "DeFi Report Generator",
    description: "Generates detailed DeFi reports from on-chain data — TVL, APY, protocol volume, with LLM-driven insights.",
    contractAddress: "0x0000000000000000000000000000000000000003",
    skills: [BUILT_IN_SKILLS[2], BUILT_IN_SKILLS[3]],
    bondAmount: BigInt("200000000000000000000"), // 200 RITUAL
    totalEarnings: BigInt("200000000000000000000"),
    avgRating: 4.8,
    jobCount: 42,
    active: true,
  },
  {
    id: "4",
    name: "On-Chain Data Scout",
    description: "Fetches data from the Ritual Chain explorer and returns it as ready-to-use JSON for other agents.",
    contractAddress: "0x0000000000000000000000000000000000000004",
    skills: [BUILT_IN_SKILLS[3]],
    bondAmount: BigInt("30000000000000000000"), // 30 RITUAL
    totalEarnings: BigInt("150000000000000000000"),
    avgRating: 4.0,
    jobCount: 67,
    active: true,
  },
]

// ── Mock Job Requests (for agent detail page) ──

export const MOCK_JOB_REQUESTS: JobRequestInfo[] = [
  {
    id: "1",
    requester: "0x000000000000000000000000000000000000000a",
    requiredSkillIds: [BUILT_IN_SKILLS[0].skillId, BUILT_IN_SKILLS[1].skillId],
    taskData: JSON.stringify({ query: "Analyze BTC sentiment from last 24h" }),
    reward: BigInt("100000000000000000"),
    status: "OPEN",
    provider: "0x0000000000000000000000000000000000000000",
    resultData: "",
    rating: 0,
  },
  {
    id: "2",
    requester: "0x000000000000000000000000000000000000000b",
    requiredSkillIds: [BUILT_IN_SKILLS[0].skillId],
    taskData: JSON.stringify({ query: "Get ETH price on Base chain" }),
    reward: BigInt("50000000000000000"),
    status: "IN_PROGRESS",
    provider: "0x0000000000000000000000000000000000000001",
    resultData: "",
    rating: 0,
  },
  {
    id: "3",
    requester: "0x000000000000000000000000000000000000000c",
    requiredSkillIds: [BUILT_IN_SKILLS[2].skillId, BUILT_IN_SKILLS[3].skillId],
    taskData: JSON.stringify({ query: "Generate DeFi report for top 5 L2s" }),
    reward: BigInt("200000000000000000"),
    status: "COMPLETED",
    provider: "0x0000000000000000000000000000000000000003",
    resultData: JSON.stringify({ status: "completed", summary: "..." }),
    rating: 5,
  },
  {
    id: "4",
    requester: "0x000000000000000000000000000000000000000d",
    requiredSkillIds: [BUILT_IN_SKILLS[1].skillId],
    taskData: JSON.stringify({ query: "Analyze sentiment of recent NFT market news" }),
    reward: BigInt("75000000000000000"),
    status: "ASSIGNED",
    provider: "0x0000000000000000000000000000000000000001",
    resultData: "",
    rating: 0,
  },
  {
    id: "5",
    requester: "0x000000000000000000000000000000000000000e",
    requiredSkillIds: [BUILT_IN_SKILLS[3].skillId],
    taskData: JSON.stringify({ query: "Fetch latest block data from Ritual explorer" }),
    reward: BigInt("30000000000000000"),
    status: "COMPLETED",
    provider: "0x0000000000000000000000000000000000000004",
    resultData: JSON.stringify({ blockNumber: 19790042, txCount: 156, timestamp: "2026-07-03T12:00:00Z" }),
    rating: 5,
  },
  {
    id: "6",
    requester: "0x000000000000000000000000000000000000000f",
    requiredSkillIds: [BUILT_IN_SKILLS[2].skillId, BUILT_IN_SKILLS[0].skillId],
    taskData: JSON.stringify({ query: "Compare TVL across Arbitrum, Optimism, Base" }),
    reward: BigInt("150000000000000000"),
    status: "OPEN",
    provider: "0x0000000000000000000000000000000000000000",
    resultData: "",
    rating: 0,
  },
  {
    id: "7",
    requester: "0x0000000000000000000000000000000000000010",
    requiredSkillIds: [BUILT_IN_SKILLS[0].skillId],
    taskData: JSON.stringify({ query: "Get SOL price in USD" }),
    reward: BigInt("25000000000000000"),
    status: "COMPLETED",
    provider: "0x0000000000000000000000000000000000000002",
    resultData: JSON.stringify({ token: "SOL", price: 142.53, source: "CoinGecko" }),
    rating: 4,
  },
  {
    id: "8",
    requester: "0x0000000000000000000000000000000000000011",
    requiredSkillIds: [BUILT_IN_SKILLS[2].skillId],
    taskData: JSON.stringify({ query: "Generate weekly DeFi market summary" }),
    reward: BigInt("180000000000000000"),
    status: "DISPUTED",
    provider: "0x0000000000000000000000000000000000000003",
    resultData: JSON.stringify({ summary: "Weekly DeFi report..." }),
    rating: 0,
  },
]

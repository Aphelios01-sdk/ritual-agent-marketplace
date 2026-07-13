#!/usr/bin/env node
/**
 * Ritual Agentry MCP Server
 *
 * Integrate Ritual agents with Ritual Agentry via MCP tools — no browser wallet UI.
 * Signing key lives only in env (AGENT_PRIVATE_KEY). Never paste keys into the website.
 *
 * Run:
 *   AGENT_PRIVATE_KEY=0x… pnpm mcp
 *   # or
 *   AGENT_PRIVATE_KEY=0x… node mcp/server.mjs
 *
 * Claude Desktop / Cursor / mcporter: point command at this file (see /integrate).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  stringToHex,
  formatEther,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

// ── Config (Ritual Agentry on Ritual 1979) ───────────────────

const RPC = process.env.RITUAL_RPC_URL || process.env.RPC_URL || "https://rpc.ritualfoundation.org"
const CHAIN_ID = 1979

const REGISTRY = (process.env.REGISTRY || "0x058756c754CAD054571933be57E3AADD3c3660F4")
const JOB_MARKET = (process.env.JOB_MARKET_V2 || "0xD4FD366d2C6884C5c76890a489Fc876CF5695E9A")
const STAKING = (process.env.STAKING || "0xdF186d42Ffe22246dB6FaE8d3E6AB29735ecfF18")
const HEARTBEAT = (process.env.HEARTBEAT || "0x157802f666233ffd2723b0596fa89824D1aea5aB")
const DIRECTORY = (process.env.DIRECTORY || "0x539753c8E5f3b69ecD3171B2bBFe46150294eaa2")
const DISPUTE = (process.env.DISPUTE || "0xBCD900214234fDeCe9Edc689edc7D0317748e9B4")

const HTTP_PC = "0x0000000000000000000000000000000000000801"
const LLM_PC = "0x0000000000000000000000000000000000000802"

const ritual = {
  id: CHAIN_ID,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
}

const REGISTRY_ABI = [
  {
    type: "function",
    name: "registerAgent",
    inputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "agentContract", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "agentByContract",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agents",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "agentContract", type: "address" },
      { name: "bondAmount", type: "uint256" },
      { name: "totalEarnings", type: "uint256" },
      { name: "avgRating", type: "uint256" },
      { name: "jobCount", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextAgentId",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAgentSkills",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "skillId", type: "bytes32" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "precompileAddr", type: "address" },
          { name: "configData", type: "bytes" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setSkills",
    inputs: [
      { name: "agentId", type: "uint256" },
      {
        name: "newSkills",
        type: "tuple[]",
        components: [
          { name: "skillId", type: "bytes32" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "precompileAddr", type: "address" },
          { name: "configData", type: "bytes" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
]

const STAKING_ABI = [
  {
    type: "function",
    name: "stake",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getStake",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "lockedUntil", type: "uint256" },
      { name: "strikes", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },
]

const HEARTBEAT_ABI = [
  { type: "function", name: "ping", inputs: [], outputs: [], stateMutability: "nonpayable" },
]

const JOB_ABI = [
  {
    type: "function",
    name: "nextJobId",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "jobs",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "requester", type: "address" },
      { name: "taskData", type: "bytes" },
      { name: "reward", type: "uint256" },
      { name: "bondRequired", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "provider", type: "address" },
      { name: "resultData", type: "bytes" },
      { name: "deadline", type: "uint256" },
      { name: "rating", type: "uint8" },
      { name: "acceptedAt", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBids",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "provider", type: "address" },
          { name: "price", type: "uint256" },
          { name: "estBlocks", type: "uint256" },
          { name: "submittedAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "requestService",
    inputs: [
      { name: "requiredSkillIds", type: "bytes32[]" },
      { name: "taskData", type: "bytes" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "assignJob",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "bidIndex", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "rateProvider",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "rating", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "dispute",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitBid",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "estBlocks", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "startProcessing",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "submitResult",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "resultData", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
]

const DISPUTE_ABI = [
  {
    type: "function",
    name: "stakeAsVerifier",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "vote",
    inputs: [
      { name: "disputeId", type: "uint256" },
      { name: "v", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "nextDisputeId",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "disputes",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "jobId", type: "uint256" },
      { name: "requester", type: "address" },
      { name: "provider", type: "address" },
      { name: "status", type: "uint8" },
      { name: "votesForRequester", type: "uint256" },
      { name: "votesForProvider", type: "uint256" },
    ],
    stateMutability: "view",
  },
]

const DIRECTORY_ABI = [
  {
    type: "function",
    name: "setProfile",
    inputs: [
      { name: "category", type: "bytes32" },
      { name: "tags", type: "bytes32[]" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
]

const SKILL_CATALOG = [
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000001",
    name: "fetch-token-price",
    description: "Fetch real-time token price from CoinGecko",
    precompileType: "HTTP",
    config: { url: "https://api.coingecko.com/api/v3/simple/price", method: "GET" },
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000002",
    name: "sentiment-analysis",
    description: "Analyze sentiment via LLM precompile",
    precompileType: "LLM",
    config: { model: "zai-org/GLM-4.7-FP8" },
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000003",
    name: "defi-report",
    description: "Generate structured DeFi report from market data",
    precompileType: "LLM",
    config: { model: "zai-org/GLM-4.7-FP8" },
  },
  {
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000004",
    name: "fetch-onchain-data",
    description: "Fetch on-chain data from Ritual explorer",
    precompileType: "HTTP",
    config: { url: "https://explorer.ritualfoundation.org/api", method: "GET" },
  },
]

const JOB_STATUS = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DISPUTED", "REFUNDED", "CANCELLED"]

const publicClient = createPublicClient({ chain: ritual, transport: http(RPC) })

function requireSigner() {
  const pk = process.env.AGENT_PRIVATE_KEY || process.env.PRIVATE_KEY
  if (!pk || !pk.startsWith("0x") || pk.length !== 66) {
    throw new Error(
      "AGENT_PRIVATE_KEY (0x + 64 hex) required for write tools. Set in MCP server env — never paste into the website.",
    )
  }
  const account = privateKeyToAccount(pk)
  const wallet = createWalletClient({
    account,
    chain: ritual,
    transport: http(RPC),
  })
  return { account, wallet }
}

function text(obj) {
  return {
    content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }],
  }
}

function err(e) {
  const msg = e instanceof Error ? e.message : String(e)
  return { content: [{ type: "text", text: JSON.stringify({ error: msg }, null, 2) }], isError: true }
}

function toSkills(skillIds) {
  const ids = skillIds?.length
    ? skillIds
    : [SKILL_CATALOG[0].skillId, SKILL_CATALOG[1].skillId]
  return ids.map((id) => {
    const cat = SKILL_CATALOG.find((s) => s.skillId === id)
    const precompileType = cat?.precompileType || "HTTP"
    return {
      skillId: id,
      name: cat?.name || id,
      description: cat?.description || "",
      precompileAddr: precompileType === "LLM" ? LLM_PC : HTTP_PC,
      configData: stringToHex(JSON.stringify(cat?.config || {})),
      active: true,
    }
  })
}

// ── Tools ───────────────────────────────────────────────────

const TOOLS = [
  {
    name: "pm_status",
    description:
      "Ritual Agentry health: chain block, signer address (if AGENT_PRIVATE_KEY set), balances, registration status.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "pm_skill_catalog",
    description: "List built-in Ritual Agentry skills (skillId, HTTP/LLM precompile) for set_skills.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "pm_list_agents",
    description: "List agents registered on AgentRegistry (id, name, contract, rating, jobs).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max agents to return (default 20)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "pm_get_agent",
    description: "Get one agent by numeric id, including skills.",
    inputSchema: {
      type: "object",
      properties: { agent_id: { type: "string", description: "Agent id (e.g. \"1\")" } },
      required: ["agent_id"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_list_jobs",
    description: "List jobs from JobMarketV2. Optionally filter by status OPEN/ASSIGNED/…",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "OPEN | ASSIGNED | IN_PROGRESS | COMPLETED | …" },
        limit: { type: "number", description: "Max jobs (default 20)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "pm_register_agent",
    description:
      "Register signer as agent on AgentRegistry. Requires AGENT_PRIVATE_KEY. agentContract = signer address.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_set_skills",
    description:
      "Install/replace skills for the signer’s agent. Pass skill_ids from pm_skill_catalog.",
    inputSchema: {
      type: "object",
      properties: {
        skill_ids: {
          type: "array",
          items: { type: "string" },
          description: "bytes32 skill ids (0x…)",
        },
        agent_id: { type: "string", description: "Optional; defaults to agentByContract(signer)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "pm_stake",
    description: "Stake RITUAL bond on AgentStaking (required to bid).",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "string", description: "Amount in RITUAL, e.g. \"0.1\"" },
      },
      required: ["amount"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_heartbeat",
    description: "Ping Ritual Agentry AgentHeartbeat (liveness).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "pm_set_profile",
    description: "Set AgentDirectory metadataURI (avatar URL or JSON with image field).",
    inputSchema: {
      type: "object",
      properties: {
        metadata_uri: { type: "string" },
        category: { type: "string", description: "Category label, default general" },
      },
      required: ["metadata_uri"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_post_job",
    description:
      "USER role: post a job with escrowed reward (requestService). Pass skill_ids + task + reward in RITUAL.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Prompt / task text" },
        reward: { type: "string", description: "Escrow reward in RITUAL e.g. \"0.1\"" },
        skill_ids: { type: "array", items: { type: "string" }, description: "Required skill ids" },
      },
      required: ["task", "reward"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_list_bids",
    description: "USER role: list bids on a job before assign.",
    inputSchema: {
      type: "object",
      properties: { job_id: { type: "string" } },
      required: ["job_id"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_assign_job",
    description: "USER role: assign a bid (bid_index from pm_list_bids).",
    inputSchema: {
      type: "object",
      properties: {
        job_id: { type: "string" },
        bid_index: { type: "number" },
        top_up: { type: "string", description: "Optional top-up RITUAL (default 0)" },
      },
      required: ["job_id", "bid_index"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_rate",
    description: "USER role: rate provider 1–5 after completion.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: { type: "string" },
        rating: { type: "number", description: "1 to 5" },
      },
      required: ["job_id", "rating"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_dispute_job",
    description: "USER role: open a dispute on a job.",
    inputSchema: {
      type: "object",
      properties: { job_id: { type: "string" } },
      required: ["job_id"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_submit_bid",
    description: "ASP role: bid on an open job.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: { type: "string" },
        price: { type: "string", description: "Bid price in RITUAL" },
        est_blocks: { type: "number", description: "Estimated blocks (default 100)" },
      },
      required: ["job_id", "price"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_stake_verifier",
    description: "EVALUATOR role: stake as dispute council verifier (msg.value).",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "string", description: "Stake amount in RITUAL" },
      },
      required: ["amount"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_list_disputes",
    description: "EVALUATOR role: list recent disputes (best-effort read).",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number" } },
      additionalProperties: false,
    },
  },
  {
    name: "pm_vote_dispute",
    description: "EVALUATOR role: vote on dispute. favor: requester | provider (maps to 0 | 1).",
    inputSchema: {
      type: "object",
      properties: {
        dispute_id: { type: "string" },
        favor: { type: "string", enum: ["requester", "provider"] },
      },
      required: ["dispute_id", "favor"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_start_processing",
    description: "After assignment, start processing and post bond.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: { type: "string" },
        bond: { type: "string", description: "Bond in RITUAL" },
      },
      required: ["job_id", "bond"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_submit_result",
    description: "Submit job result bytes/text after work is done.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: { type: "string" },
        result: { type: "string", description: "Result text or JSON string" },
      },
      required: ["job_id", "result"],
      additionalProperties: false,
    },
  },
  {
    name: "pm_integrate",
    description:
      "One-shot integrate: register (if needed) + set_skills + stake + heartbeat. Use after funding the signer.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        skill_ids: { type: "array", items: { type: "string" } },
        stake_amount: { type: "string", description: "Default 0.1" },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
]

async function handleTool(name, args = {}) {
  switch (name) {
    case "pm_status": {
      const block = await publicClient.getBlockNumber()
      let signer = null
      let balance = null
      let agentId = null
      let stake = null
      try {
        const { account } = requireSigner()
        signer = account.address
        balance = formatEther(await publicClient.getBalance({ address: account.address }))
        agentId = String(
          await publicClient.readContract({
            address: REGISTRY,
            abi: REGISTRY_ABI,
            functionName: "agentByContract",
            args: [account.address],
          }),
        )
        const st = await publicClient.readContract({
          address: STAKING,
          abi: STAKING_ABI,
          functionName: "getStake",
          args: [account.address],
        })
        stake = {
          amount: formatEther(st[0]),
          lockedUntil: String(st[1]),
          strikes: String(st[2]),
          active: st[3],
        }
      } catch (e) {
        signer = null
        balance = e instanceof Error ? e.message : String(e)
      }
      return text({
        ok: true,
        chainId: CHAIN_ID,
        rpc: RPC,
        block: String(block),
        contracts: { registry: REGISTRY, jobMarketV2: JOB_MARKET, staking: STAKING, heartbeat: HEARTBEAT },
        signer,
        balanceRITUAL: balance,
        agentId: agentId === "0" ? null : agentId,
        stake,
        docs: "https://ritual-agent-marketplace-xi.vercel.app/integrate",
      })
    }

    case "pm_skill_catalog":
      return text({ skills: SKILL_CATALOG, http: HTTP_PC, llm: LLM_PC })

    case "pm_list_agents": {
      const limit = Math.min(Number(args.limit) || 20, 100)
      const next = Number(
        await publicClient.readContract({
          address: REGISTRY,
          abi: REGISTRY_ABI,
          functionName: "nextAgentId",
        }),
      )
      const agents = []
      for (let id = next; id >= 1 && agents.length < limit; id--) {
        try {
          const raw = await publicClient.readContract({
            address: REGISTRY,
            abi: REGISTRY_ABI,
            functionName: "agents",
            args: [BigInt(id)],
          })
          if (!raw[1]) continue
          agents.push({
            id: String(raw[0]),
            name: raw[1],
            description: raw[2],
            contract: raw[3],
            bondAmount: formatEther(raw[4]),
            totalEarnings: formatEther(raw[5]),
            avgRating: Number(raw[6]) / 100,
            jobCount: Number(raw[7]),
            active: raw[8],
          })
        } catch {
          /* skip */
        }
      }
      return text({ count: agents.length, agents })
    }

    case "pm_get_agent": {
      const id = BigInt(args.agent_id)
      const raw = await publicClient.readContract({
        address: REGISTRY,
        abi: REGISTRY_ABI,
        functionName: "agents",
        args: [id],
      })
      const skills = await publicClient.readContract({
        address: REGISTRY,
        abi: REGISTRY_ABI,
        functionName: "getAgentSkills",
        args: [id],
      })
      return text({
        id: String(raw[0]),
        name: raw[1],
        description: raw[2],
        contract: raw[3],
        bondAmount: formatEther(raw[4]),
        totalEarnings: formatEther(raw[5]),
        avgRating: Number(raw[6]) / 100,
        jobCount: Number(raw[7]),
        active: raw[8],
        skills: skills.map((s) => ({
          skillId: s.skillId,
          name: s.name,
          description: s.description,
          precompile: s.precompileAddr,
          active: s.active,
        })),
      })
    }

    case "pm_list_jobs": {
      const limit = Math.min(Number(args.limit) || 20, 50)
      const next = Number(
        await publicClient.readContract({
          address: JOB_MARKET,
          abi: JOB_ABI,
          functionName: "nextJobId",
        }),
      )
      const want = args.status ? String(args.status).toUpperCase() : null
      const jobs = []
      for (let id = next; id >= 1 && jobs.length < limit; id--) {
        try {
          const j = await publicClient.readContract({
            address: JOB_MARKET,
            abi: JOB_ABI,
            functionName: "jobs",
            args: [BigInt(id)],
          })
          const status = JOB_STATUS[Number(j[5])] || "UNKNOWN"
          if (want && status !== want) continue
          if (j[1] === "0x0000000000000000000000000000000000000000") continue
          let task = j[2]
          try {
            task = Buffer.from(String(j[2]).slice(2), "hex").toString("utf8")
          } catch {
            /* keep hex */
          }
          jobs.push({
            id: String(j[0]),
            requester: j[1],
            taskData: task,
            reward: formatEther(j[3]),
            bondRequired: formatEther(j[4]),
            status,
            provider: j[6],
            deadline: String(j[8]),
          })
        } catch {
          /* skip */
        }
      }
      return text({ count: jobs.length, jobs })
    }

    case "pm_register_agent": {
      const { account, wallet } = requireSigner()
      const existing = await publicClient.readContract({
        address: REGISTRY,
        abi: REGISTRY_ABI,
        functionName: "agentByContract",
        args: [account.address],
      })
      if (existing !== 0n) {
        return text({ alreadyRegistered: true, agentId: String(existing), address: account.address })
      }
      const hash = await wallet.writeContract({
        address: REGISTRY,
        abi: REGISTRY_ABI,
        functionName: "registerAgent",
        args: [args.name, args.description || "MCP-integrated Ritual agent", account.address],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const agentId = await publicClient.readContract({
        address: REGISTRY,
        abi: REGISTRY_ABI,
        functionName: "agentByContract",
        args: [account.address],
      })
      return text({
        ok: true,
        tx: hash,
        block: String(receipt.blockNumber),
        agentId: String(agentId),
        address: account.address,
      })
    }

    case "pm_set_skills": {
      const { account, wallet } = requireSigner()
      let agentId = args.agent_id
        ? BigInt(args.agent_id)
        : await publicClient.readContract({
            address: REGISTRY,
            abi: REGISTRY_ABI,
            functionName: "agentByContract",
            args: [account.address],
          })
      if (agentId === 0n) throw new Error("Agent not registered — call pm_register_agent first")
      const skills = toSkills(args.skill_ids)
      const hash = await wallet.writeContract({
        address: REGISTRY,
        abi: REGISTRY_ABI,
        functionName: "setSkills",
        args: [agentId, skills],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash, agentId: String(agentId), skills: skills.map((s) => s.name) })
    }

    case "pm_stake": {
      const { wallet } = requireSigner()
      const value = parseEther(String(args.amount))
      const hash = await wallet.writeContract({
        address: STAKING,
        abi: STAKING_ABI,
        functionName: "stake",
        args: [],
        value,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash, amount: String(args.amount) })
    }

    case "pm_heartbeat": {
      const { wallet } = requireSigner()
      const hash = await wallet.writeContract({
        address: HEARTBEAT,
        abi: HEARTBEAT_ABI,
        functionName: "ping",
        args: [],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash })
    }

    case "pm_set_profile": {
      const { wallet } = requireSigner()
      const { keccak256, toBytes } = await import("viem")
      const category = keccak256(toBytes(args.category || "general"))
      const hash = await wallet.writeContract({
        address: DIRECTORY,
        abi: DIRECTORY_ABI,
        functionName: "setProfile",
        args: [category, [], args.metadata_uri],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash, metadataURI: args.metadata_uri })
    }

    case "pm_post_job": {
      const { wallet } = requireSigner()
      const skillIds = (args.skill_ids?.length ? args.skill_ids : [SKILL_CATALOG[0].skillId]).map(
        (id) => id,
      )
      const value = parseEther(String(args.reward))
      const hash = await wallet.writeContract({
        address: JOB_MARKET,
        abi: JOB_ABI,
        functionName: "requestService",
        args: [skillIds, stringToHex(String(args.task))],
        value,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const next = await publicClient.readContract({
        address: JOB_MARKET,
        abi: JOB_ABI,
        functionName: "nextJobId",
      })
      return text({
        ok: true,
        tx: hash,
        block: String(receipt.blockNumber),
        jobId: String(next - 1n),
        reward: String(args.reward),
        skillIds,
      })
    }

    case "pm_list_bids": {
      const bids = await publicClient.readContract({
        address: JOB_MARKET,
        abi: JOB_ABI,
        functionName: "getBids",
        args: [BigInt(args.job_id)],
      })
      return text({
        jobId: String(args.job_id),
        bids: bids.map((b, i) => ({
          index: i,
          provider: b.provider,
          price: formatEther(b.price),
          estBlocks: String(b.estBlocks),
          submittedAt: String(b.submittedAt),
        })),
      })
    }

    case "pm_assign_job": {
      const { wallet } = requireSigner()
      const topUp = args.top_up ? parseEther(String(args.top_up)) : 0n
      const hash = await wallet.writeContract({
        address: JOB_MARKET,
        abi: JOB_ABI,
        functionName: "assignJob",
        args: [BigInt(args.job_id), BigInt(args.bid_index)],
        value: topUp,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash, jobId: String(args.job_id), bidIndex: args.bid_index })
    }

    case "pm_rate": {
      const { wallet } = requireSigner()
      const rating = BigInt(Math.min(5, Math.max(1, Number(args.rating) || 1)))
      const hash = await wallet.writeContract({
        address: JOB_MARKET,
        abi: JOB_ABI,
        functionName: "rateProvider",
        args: [BigInt(args.job_id), rating],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash, rating: String(rating) })
    }

    case "pm_dispute_job": {
      const { wallet } = requireSigner()
      const hash = await wallet.writeContract({
        address: JOB_MARKET,
        abi: JOB_ABI,
        functionName: "dispute",
        args: [BigInt(args.job_id)],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash, jobId: String(args.job_id) })
    }

    case "pm_submit_bid": {
      const { wallet } = requireSigner()
      const hash = await wallet.writeContract({
        address: JOB_MARKET,
        abi: JOB_ABI,
        functionName: "submitBid",
        args: [
          BigInt(args.job_id),
          parseEther(String(args.price)),
          BigInt(args.est_blocks ?? 100),
        ],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash, jobId: String(args.job_id) })
    }

    case "pm_stake_verifier": {
      const { wallet } = requireSigner()
      const hash = await wallet.writeContract({
        address: DISPUTE,
        abi: DISPUTE_ABI,
        functionName: "stakeAsVerifier",
        args: [],
        value: parseEther(String(args.amount)),
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash, amount: String(args.amount) })
    }

    case "pm_list_disputes": {
      const limit = Math.min(Number(args.limit) || 20, 50)
      let next = 0n
      try {
        next = await publicClient.readContract({
          address: DISPUTE,
          abi: DISPUTE_ABI,
          functionName: "nextDisputeId",
        })
      } catch {
        return text({
          count: 0,
          disputes: [],
          note: "DisputeCouncil nextDisputeId unavailable — check contract layout",
        })
      }
      const disputes = []
      const n = Number(next)
      for (let id = n; id >= 1 && disputes.length < limit; id--) {
        try {
          const d = await publicClient.readContract({
            address: DISPUTE,
            abi: DISPUTE_ABI,
            functionName: "disputes",
            args: [BigInt(id)],
          })
          disputes.push({
            id: String(d[0] ?? id),
            jobId: String(d[1]),
            requester: d[2],
            provider: d[3],
            status: Number(d[4]),
            votesForRequester: String(d[5]),
            votesForProvider: String(d[6]),
          })
        } catch {
          /* skip */
        }
      }
      return text({ count: disputes.length, disputes })
    }

    case "pm_vote_dispute": {
      const { wallet } = requireSigner()
      const favor = String(args.favor || "").toLowerCase()
      const v = favor === "provider" ? 1 : 0
      const hash = await wallet.writeContract({
        address: DISPUTE,
        abi: DISPUTE_ABI,
        functionName: "vote",
        args: [BigInt(args.dispute_id), v],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash, disputeId: String(args.dispute_id), favor, v })
    }

    case "pm_start_processing": {
      const { wallet } = requireSigner()
      const hash = await wallet.writeContract({
        address: JOB_MARKET,
        abi: JOB_ABI,
        functionName: "startProcessing",
        args: [BigInt(args.job_id)],
        value: parseEther(String(args.bond)),
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash })
    }

    case "pm_submit_result": {
      const { wallet } = requireSigner()
      const hash = await wallet.writeContract({
        address: JOB_MARKET,
        abi: JOB_ABI,
        functionName: "submitResult",
        args: [BigInt(args.job_id), stringToHex(String(args.result))],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return text({ ok: true, tx: hash })
    }

    case "pm_integrate": {
      const { account, wallet } = requireSigner()
      const steps = []
      let agentId = await publicClient.readContract({
        address: REGISTRY,
        abi: REGISTRY_ABI,
        functionName: "agentByContract",
        args: [account.address],
      })
      if (agentId === 0n) {
        const hash = await wallet.writeContract({
          address: REGISTRY,
          abi: REGISTRY_ABI,
          functionName: "registerAgent",
          args: [
            args.name,
            args.description || "MCP-integrated Ritual agent on Ritual Agentry",
            account.address,
          ],
        })
        await publicClient.waitForTransactionReceipt({ hash })
        agentId = await publicClient.readContract({
          address: REGISTRY,
          abi: REGISTRY_ABI,
          functionName: "agentByContract",
          args: [account.address],
        })
        steps.push({ step: "register", tx: hash, agentId: String(agentId) })
      } else {
        steps.push({ step: "register", skipped: true, agentId: String(agentId) })
      }

      const skills = toSkills(args.skill_ids)
      const txSkills = await wallet.writeContract({
        address: REGISTRY,
        abi: REGISTRY_ABI,
        functionName: "setSkills",
        args: [agentId, skills],
      })
      await publicClient.waitForTransactionReceipt({ hash: txSkills })
      steps.push({ step: "set_skills", tx: txSkills, skills: skills.map((s) => s.name) })

      const stakeAmt = String(args.stake_amount || "0.1")
      const txStake = await wallet.writeContract({
        address: STAKING,
        abi: STAKING_ABI,
        functionName: "stake",
        args: [],
        value: parseEther(stakeAmt),
      })
      await publicClient.waitForTransactionReceipt({ hash: txStake })
      steps.push({ step: "stake", tx: txStake, amount: stakeAmt })

      const txHb = await wallet.writeContract({
        address: HEARTBEAT,
        abi: HEARTBEAT_ABI,
        functionName: "ping",
        args: [],
      })
      await publicClient.waitForTransactionReceipt({ hash: txHb })
      steps.push({ step: "heartbeat", tx: txHb })

      return text({
        ok: true,
        address: account.address,
        agentId: String(agentId),
        steps,
        next: "Call pm_list_jobs with status OPEN, then pm_submit_bid.",
      })
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// ── MCP server ──────────────────────────────────────────────

const server = new Server(
  { name: "ritual-agentry", version: "1.0.0" },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name
  const args = request.params.arguments || {}
  try {
    return await handleTool(name, args)
  } catch (e) {
    return err(e)
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stderr only — stdout is MCP protocol
  console.error("ritual-agentry MCP ready (stdio)")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

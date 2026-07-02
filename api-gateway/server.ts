// SPDX-License-Identifier: MIT
//
// API Gateway Web2 (off-chain) — Module C, feature 7
// --------------------------------------------------------------
// A Web2 → on-chain bridge. Web2 clients (curl, bots, non-EVM apps) can query the
// marketplace and submit jobs via REST/JSON, without a wallet or EVM knowledge.
//
// Endpoints:
//   GET  /health                       → { ok, block, chain }
//   GET  /agents                       → list of active agents (registry.getActiveAgents)
//   GET  /agents/:id                   → agent detail + skills (getAgent + getAgentSkills)
//   GET  /jobs/:id                     → JobRequest (JobMarketV2.jobs)
//   GET  /jobs/agent/:addr             → provider jobs (getProviderJobs)
//   POST /jobs                         → relay requestService (requires a SIGNER private key)
//        body: { requiredSkillIds: ["0x..."], taskData: "0x...", rewardWei: "100000" }
//
// Run:  node api-gateway/server.js
// Env:  RPC_URL, PORT (default 8787), SIGNER_PK (optional, for POST /jobs)
//      REGISTRY, JOB_MARKET_V2 (override addresses; defaults pulled from config)
//
// ponytail: native http + viem (already in the repo). No extra dependencies.
//           No auth/rate-limiting — add before production. POST relay uses a trusted signer.

import http from "node:http"
import { createPublicClient, createWalletClient, http as viemTransport, type Chain } from "viem"

const RPC_URL = process.env.RPC_URL || "https://rpc.ritualfoundation.org"
const PORT = Number(process.env.PORT || 8787)
const SIGNER_PK = process.env.SIGNER_PK || ""
const CHAIN_ID = 1979

// Hardening: optional API key (required for POST /jobs when set) + per-IP rate limit.
const API_KEY = process.env.API_KEY || ""
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 60)
const RATE_WINDOW_MS = 60_000

if (!API_KEY) {
  console.warn("[api-gateway] WARNING: API_KEY not set — POST /jobs is unauthenticated. Set API_KEY in production.")
}

const REGISTRY = (process.env.REGISTRY || "0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5") as `0x${string}`
const JOB_MARKET_V2 = (process.env.JOB_MARKET_V2 || "0x14781a0e7e559f2a651115f83467e7ae55ccd6d6") as `0x${string}`

const ritualChain: Chain = {
  id: CHAIN_ID,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
}

const publicClient = createPublicClient({ chain: ritualChain, transport: viemTransport(RPC_URL) })

const REGISTRY_ABI = [
  { inputs: [], name: "getActiveAgents", outputs: [{ type: "tuple[]", components: [
    { name: "id", type: "uint256" }, { name: "name", type: "string" }, { name: "description", type: "string" },
    { name: "agentContract", type: "address" }, { name: "bondAmount", type: "uint256" },
    { name: "totalEarnings", type: "uint256" }, { name: "avgRating", type: "uint256" },
    { name: "jobCount", type: "uint256" }, { name: "active", type: "bool" },
  ] }], stateMutability: "view", type: "function" },
  { inputs: [{ type: "uint256" }], name: "getAgent", outputs: [{ type: "tuple", components: [
    { name: "id", type: "uint256" }, { name: "name", type: "string" }, { name: "description", type: "string" },
    { name: "agentContract", type: "address" }, { name: "bondAmount", type: "uint256" },
    { name: "totalEarnings", type: "uint256" }, { name: "avgRating", type: "uint256" },
    { name: "jobCount", type: "uint256" }, { name: "active", type: "bool" },
  ] }], stateMutability: "view", type: "function" },
  { inputs: [{ type: "uint256" }], name: "getAgentSkills", outputs: [{ type: "tuple[]", components: [
    { name: "skillId", type: "bytes32" }, { name: "name", type: "string" }, { name: "description", type: "string" },
    { name: "precompileAddr", type: "address" }, { name: "configData", type: "bytes" }, { name: "active", type: "bool" },
  ] }], stateMutability: "view", type: "function" },
] as const

const JOB_MARKET_ABI = [
  { inputs: [{ type: "uint256" }], name: "jobs", outputs: [{ type: "tuple", components: [
    { name: "requester", type: "address" }, { name: "provider", type: "address" },
    { name: "requiredSkillIds", type: "bytes32[]" }, { name: "taskData", type: "bytes" },
    { name: "reward", type: "uint256" }, { name: "bond", type: "uint256" },
    { name: "status", type: "uint8" }, { name: "rating", type: "uint8" },
    { name: "createdAt", type: "uint256" }, { name: "deadline", type: "uint256" },
  ] }], stateMutability: "view", type: "function" },
  { inputs: [{ type: "address" }], name: "getProviderJobs", outputs: [{ type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ type: "uint256" }], name: "getBids", outputs: [{ type: "tuple[]", components: [
    { name: "bidder", type: "address" }, { name: "price", type: "uint256" }, { name: "etaBlocks", type: "uint256" }, { name: "active", type: "bool" },
  ] }], stateMutability: "view", type: "function" },
  { inputs: [{ type: "bytes32[]" }, { type: "bytes" }], name: "requestService", outputs: [{ type: "uint256" }], stateMutability: "payable", type: "function" },
] as const

const JOB_STATUS_NAMES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DISPUTED", "REFUNDED", "CANCELLED"]

// ── helpers ──
const json = (res: Record<string, any>, status = 200) => {
  const body = JSON.stringify(res)
  return { status, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }, body }
}
const readBody = (req: http.IncomingMessage) => new Promise<string>((resolve) => {
  let d = ""; req.on("data", (c) => { d += c; if (d.length > 1e6) req.destroy() }); req.on("end", () => resolve(d))
})
const agentInfoToObj = (a: any) => ({
  id: String(a.id), name: a.name, description: a.description,
  contract: a.agentContract, bondAmount: a.bondAmount.toString(),
  totalEarnings: a.totalEarnings.toString(), avgRating: Number(a.avgRating) / 100,
  jobCount: Number(a.jobCount), active: a.active,
})
const skillToObj = (s: any) => ({ skillId: s.skillId, name: s.name, description: s.description, precompile: s.precompileAddr, active: s.active })
const jobToObj = (j: any) => ({
  requester: j.requester, provider: j.provider,
  requiredSkillIds: j.requiredSkillIds, taskData: j.taskData,
  reward: j.reward.toString(), bond: j.bond.toString(),
  status: JOB_STATUS_NAMES[Number(j.status)] || "UNKNOWN", rating: Number(j.rating),
  createdAt: Number(j.createdAt), deadline: Number(j.deadline),
})

// ── router ──
async function handle(req: http.IncomingMessage, url: URL): Promise<{ status: number; headers: Record<string,string>; body: string }> {
  const p = url.pathname

  if (req.method === "OPTIONS") return json({}, 204)
  if (p === "/health") {
    const block = await publicClient.getBlockNumber()
    return json({ ok: true, block: String(block), chain: CHAIN_ID })
  }

  if (p === "/agents" && req.method === "GET") {
    const agents = await publicClient.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "getActiveAgents" }) as any[]
    return json({ count: agents.length, agents: agents.map(agentInfoToObj) })
  }

  const mAgent = p.match(/^\/agents\/(\d+)$/)
  if (mAgent && req.method === "GET") {
    const id = BigInt(mAgent[1])
    const [agent, skills] = await Promise.all([
      publicClient.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "getAgent", args: [id] }) as Promise<any>,
      publicClient.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "getAgentSkills", args: [id] }) as Promise<any[]>,
    ])
    return json({ ...agentInfoToObj(agent), skills: skills.map(skillToObj) })
  }

  const mJob = p.match(/^\/jobs\/(\d+)$/)
  if (mJob && req.method === "GET") {
    const job = await publicClient.readContract({ address: JOB_MARKET_V2, abi: JOB_MARKET_ABI, functionName: "jobs", args: [BigInt(mJob[1])] }) as any
    if (job.requester === "0x0000000000000000000000000000000000000000") return json({ error: "job not found" }, 404)
    return json({ id: mJob[1], ...jobToObj(job) })
  }

  const mProvJobs = p.match(/^\/jobs\/agent\/(0x[a-fA-F0-9]{40})$/)
  if (mProvJobs && req.method === "GET") {
    const ids = await publicClient.readContract({ address: JOB_MARKET_V2, abi: JOB_MARKET_ABI, functionName: "getProviderJobs", args: [mProvJobs[1] as `0x${string}`] }) as bigint[]
    return json({ provider: mProvJobs[1], jobIds: ids.map(String) })
  }

  if (p === "/jobs" && req.method === "POST") {
    if (!SIGNER_PK) return json({ error: "SIGNER_PK not set; relay disabled" }, 503)
    const raw = JSON.parse(await readBody(req) || "{}")
    const skillIds = raw.requiredSkillIds as `0x${string}`[]
    if (!Array.isArray(skillIds) || skillIds.length === 0) return json({ error: "requiredSkillIds required" }, 400)
    const taskData = raw.taskData as `0x${string}`
    if (!taskData?.startsWith("0x")) return json({ error: "taskData must be 0x-hex" }, 400)
    const reward = raw.rewardWei ? BigInt(raw.rewardWei) : BigInt(0)
    if (reward <= BigInt(0)) return json({ error: "rewardWei required (>0)" }, 400)

    const { privateKeyToAccount } = await import("viem/accounts")
    const account = privateKeyToAccount(SIGNER_PK as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: ritualChain, transport: viemTransport(RPC_URL) })
    const hash = await walletClient.writeContract({
      address: JOB_MARKET_V2, abi: JOB_MARKET_ABI, functionName: "requestService",
      args: [skillIds, taskData], value: reward, account,
    })
    return json({ ok: true, txHash: hash, relayedBy: account.address, rewardWei: reward.toString() }, 202)
  }

  return json({ error: "not found", path: p }, 404)
}

// ── rate limiter (per-IP fixed window, in-memory) ──
const hits = new Map<string, { count: number; resetAt: number }>()
function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_PER_MIN
}
// Periodic cleanup so the map does not grow unbounded.
setInterval(() => {
  const now = Date.now()
  for (const [ip, e] of hits) if (now > e.resetAt) hits.delete(ip)
}, RATE_WINDOW_MS).unref?.()

function clientIp(req: http.IncomingMessage): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown"
}

const server = http.createServer(async (req, res) => {
  const started = Date.now()
  const url = new URL(req.url || "/", `http://localhost:${PORT}`)
  const ip = clientIp(req)
  const method = req.method || "GET"

  // Request log: METHOD path ip — status ms (written after handling).
  try {
    // Rate limit
    if (!rateLimit(ip)) {
      const out = json({ error: "rate limit exceeded", retryMs: RATE_WINDOW_MS }, 429)
      res.writeHead(out.status, { ...out.headers, "retry-after": String(Math.ceil(RATE_WINDOW_MS / 1000)) })
      res.end(out.body)
      console.log(`${method} ${url.pathname} ${ip} — 429 ${Date.now() - started}ms`)
      return
    }

    // Auth: mutating endpoints require an API key when API_KEY is configured.
    if (method !== "GET" && method !== "OPTIONS" && API_KEY) {
      const provided = req.headers["x-api-key"]
      if (provided !== API_KEY) {
        const out = json({ error: "unauthorized", hint: "set x-api-key header" }, 401)
        res.writeHead(out.status, out.headers)
        res.end(out.body)
        console.log(`${method} ${url.pathname} ${ip} — 401 ${Date.now() - started}ms`)
        return
      }
    }

    const out = await handle(req, url)
    res.writeHead(out.status, out.headers); res.end(out.body)
    console.log(`${method} ${url.pathname} ${ip} — ${out.status} ${Date.now() - started}ms`)
  } catch (e: any) {
    const msg = e?.shortMessage || e?.message || String(e)
    res.writeHead(500, { "content-type": "application/json", "access-control-allow-origin": "*" })
    res.end(JSON.stringify({ error: "server error", detail: msg }))
    console.error(`${method} ${url.pathname} ${ip} — 500 ${Date.now() - started}ms`, msg)
  }
})

server.listen(PORT, () => {
  console.log(`[api-gateway] Ritual marketplace Web2 gateway on :${PORT} (chain ${CHAIN_ID})`)
  console.log(`  GET  /health | /agents | /agents/:id | /jobs/:id | /jobs/agent/:addr`)
  console.log(`  POST /jobs ${SIGNER_PK ? "(relay active)" : "(relay OFF — set SIGNER_PK)"}`)
  console.log(`  auth: ${API_KEY ? "API key required for writes" : "open (set API_KEY)"} · rate limit: ${RATE_LIMIT_PER_MIN}/min per IP`)
})

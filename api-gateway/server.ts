// SPDX-License-Identifier: MIT
//
// API Gateway Web2 (off-chain) — READ-ONLY
// --------------------------------------------------------------
// A Web2 → on-chain bridge. Web2 clients (curl, bots, non-EVM apps) can query the
// marketplace via REST/JSON.
//
// Write operations (post job, bid, assign, etc.) are performed by the agent's own
// wallet directly via the frontend (window.ethereum). No server relay.
//
// Endpoints:
//   GET  /health                       → { ok, block, chain }
//   GET  /agents                       → list of active agents
//   GET  /agents/:id                   → agent detail + skills
//   GET  /jobs/:id                     → job detail
//   GET  /jobs/agent/:addr             → provider's job list
//
// Run:  node api-gateway/server.js
// Env:  RPC_URL, PORT (default 8787), API_KEY (optional read auth)
//       REGISTRY, JOB_MARKET_V2 (override addresses)

import http from "node:http"
import { createPublicClient, http as viemTransport, type Chain } from "viem"

const RPC_URL = process.env.RPC_URL || "https://rpc.ritualfoundation.org"
const PORT = Number(process.env.PORT || 8787)
const CHAIN_ID = 1979

const API_KEY = process.env.API_KEY || ""
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 60)
const RATE_WINDOW_MS = 60_000

const REGISTRY = (process.env.REGISTRY || "0x058756c754CAD054571933be57E3AADD3c3660F4") as `0x${string}`
const JOB_MARKET_V2 = (process.env.JOB_MARKET_V2 || "0x34779E2Bc1B1f975Ca8c947515013412b30Cb020") as `0x${string}`

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
    { name: "id", type: "uint256" }, { name: "requester", type: "address" },
    { name: "taskData", type: "bytes" }, { name: "reward", type: "uint256" },
    { name: "bondRequired", type: "uint256" }, { name: "status", type: "uint8" },
    { name: "provider", type: "address" }, { name: "resultData", type: "bytes" },
    { name: "deadline", type: "uint256" }, { name: "rating", type: "uint8" },
    { name: "acceptedAt", type: "uint256" },
  ] }], stateMutability: "view", type: "function" },
  { inputs: [{ type: "address" }], name: "getProviderJobs", outputs: [{ type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ type: "uint256" }], name: "getBids", outputs: [{ type: "tuple[]", components: [
    { name: "provider", type: "address" }, { name: "price", type: "uint256" },
    { name: "estBlocks", type: "uint256" }, { name: "submittedAt", type: "uint256" },
  ] }], stateMutability: "view", type: "function" },
] as const

const JOB_STATUS_NAMES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DISPUTED", "REFUNDED", "CANCELLED"]

// ── helpers ──
const json = (res: Record<string, any>, status = 200) => {
  const body = JSON.stringify(res)
  return { status, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }, body }
}
const agentInfoToObj = (a: any) => ({
  id: String(a.id), name: a.name, description: a.description,
  contract: a.agentContract, bondAmount: a.bondAmount.toString(),
  totalEarnings: a.totalEarnings.toString(), avgRating: Number(a.avgRating) / 100,
  jobCount: Number(a.jobCount), active: a.active,
})
const skillToObj = (s: any) => ({ skillId: s.skillId, name: s.name, description: s.description, precompile: s.precompileAddr, active: s.active })
const jobToObj = (j: any) => ({
  id: String(j.id), requester: j.requester, provider: j.provider,
  taskData: j.taskData, reward: j.reward.toString(), bondRequired: j.bondRequired.toString(),
  status: JOB_STATUS_NAMES[Number(j.status)] || "UNKNOWN", rating: Number(j.rating),
  deadline: Number(j.deadline),
})

// ── router ──
async function handle(req: http.IncomingMessage, url: URL): Promise<{ status: number; headers: Record<string,string>; body: string }> {
  const p = url.pathname

  if (req.method === "OPTIONS") return json({}, 204)
  if (req.method !== "GET") return json({ error: "method not allowed", hint: "this gateway is read-only. Writes go through the agent's wallet." }, 405)

  if (p === "/health") {
    const block = await publicClient.getBlockNumber()
    return json({ ok: true, block: String(block), chain: CHAIN_ID })
  }

  if (p === "/agents") {
    const agents = await publicClient.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "getActiveAgents" }) as any[]
    return json({ count: agents.length, agents: agents.map(agentInfoToObj) })
  }

  const mAgent = p.match(/^\/agents\/(\d+)$/)
  if (mAgent) {
    const id = BigInt(mAgent[1])
    const [agent, skills] = await Promise.all([
      publicClient.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "getAgent", args: [id] }) as Promise<any>,
      publicClient.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "getAgentSkills", args: [id] }) as Promise<any[]>,
    ])
    return json({ ...agentInfoToObj(agent), skills: skills.map(skillToObj) })
  }

  const mJob = p.match(/^\/jobs\/(\d+)$/)
  if (mJob) {
    const job = await publicClient.readContract({ address: JOB_MARKET_V2, abi: JOB_MARKET_ABI, functionName: "jobs", args: [BigInt(mJob[1])] }) as any
    if (job.requester === "0x0000000000000000000000000000000000000000") return json({ error: "job not found" }, 404)
    return json({ ...jobToObj(job) })
  }

  const mBids = p.match(/^\/jobs\/(\d+)\/bids$/)
  if (mBids) {
    const bids = await publicClient.readContract({ address: JOB_MARKET_V2, abi: JOB_MARKET_ABI, functionName: "getBids", args: [BigInt(mBids[1])] }) as any[]
    return json({ bids: bids.map((b: any) => ({ provider: b.provider, price: b.price.toString(), estBlocks: Number(b.estBlocks), submittedAt: Number(b.submittedAt) })) })
  }

  const mProvJobs = p.match(/^\/jobs\/agent\/(0x[a-fA-F0-9]{40})$/)
  if (mProvJobs) {
    const ids = await publicClient.readContract({ address: JOB_MARKET_V2, abi: JOB_MARKET_ABI, functionName: "getProviderJobs", args: [mProvJobs[1] as `0x${string}`] }) as bigint[]
    return json({ provider: mProvJobs[1], jobIds: ids.map(String) })
  }

  return json({ error: "not found", path: p }, 404)
}

// ── rate limiter ──
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

  try {
    if (!rateLimit(ip)) {
      const out = json({ error: "rate limit exceeded", retryMs: RATE_WINDOW_MS }, 429)
      res.writeHead(out.status, { ...out.headers, "retry-after": String(Math.ceil(RATE_WINDOW_MS / 1000)) })
      res.end(out.body)
      console.log(`${method} ${url.pathname} ${ip} — 429 ${Date.now() - started}ms`)
      return
    }

    // Optional read-key auth (for /agents, /jobs)
    if (API_KEY && req.headers["x-api-key"] !== API_KEY) {
      const out = json({ error: "unauthorized", hint: "set x-api-key header" }, 401)
      res.writeHead(out.status, out.headers)
      res.end(out.body)
      console.log(`${method} ${url.pathname} ${ip} — 401 ${Date.now() - started}ms`)
      return
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
  console.log(`[api-gateway] Ritual marketplace Web2 gateway (READ-ONLY) on :${PORT} (chain ${CHAIN_ID})`)
  console.log(`  GET  /health | /agents | /agents/:id | /jobs/:id | /jobs/:id/bids | /jobs/agent/:addr`)
  console.log(`  Writes go through the agent's wallet (window.ethereum).`)
  console.log(`  rate limit: ${RATE_LIMIT_PER_MIN}/min per IP${API_KEY ? " · auth: x-api-key required" : ""}`)
})

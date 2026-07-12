#!/usr/bin/env node
/**
 * Prompt Market agent runner — auto-bid + submit result on open jobs.
 *
 * Usage:
 *   AGENT_PK=0x... node scripts/agent-runner.mjs
 *   node scripts/agent-runner.mjs --key 0x... --price 0.01 --poll 8
 *
 * Env:
 *   AGENT_PK          private key (required)
 *   RPC_URL           default https://rpc.ritualfoundation.org
 *   JOB_MARKET        JobMarketV2 address
 *   PRICE_ETH         bid price in RITUAL (default 0.01)
 *   POLL_SEC          poll interval (default 8)
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  stringToHex,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

const args = process.argv.slice(2)
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`)
  if (i >= 0 && args[i + 1]) return args[i + 1]
  return fallback
}

const PK = (flag("key", process.env.AGENT_PK) || "").trim()
const RPC = flag("rpc", process.env.RPC_URL || "https://rpc.ritualfoundation.org")
const JOB_MARKET = (flag("market", process.env.JOB_MARKET || "0xD4FD366d2C6884C5c76890a489Fc876CF5695E9A"))
const PRICE = flag("price", process.env.PRICE_ETH || "0.01")
const POLL = Number(flag("poll", process.env.POLL_SEC || "8"))
const EST_BLOCKS = BigInt(flag("blocks", "100"))

if (!PK || !PK.startsWith("0x") || PK.length !== 66) {
  console.error("Missing --key / AGENT_PK (0x + 64 hex)")
  process.exit(1)
}

const chain = {
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
}

const JOB_ABI = [
  {
    type: "function",
    name: "jobCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getJob",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "requester", type: "address" },
          { name: "provider", type: "address" },
          { name: "reward", type: "uint256" },
          { name: "bondRequired", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "deadline", type: "uint256" },
          { name: "taskData", type: "bytes" },
          { name: "resultData", type: "bytes" },
          { name: "rating", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "submitBid",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "estBlocks", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "startProcessing",
    stateMutability: "payable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "submitResult",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "resultData", type: "bytes" },
    ],
    outputs: [],
  },
]

// Fallback simpler getJob if ABI shape differs — try jobs() mapping style via multicall-less loop
const JOB_ABI_ALT = [
  {
    type: "function",
    name: "jobs",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "requester", type: "address" },
      { name: "provider", type: "address" },
      { name: "reward", type: "uint256" },
      { name: "bondRequired", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "deadline", type: "uint256" },
      { name: "taskData", type: "bytes" },
      { name: "resultData", type: "bytes" },
      { name: "rating", type: "uint8" },
    ],
  },
  ...JOB_ABI.filter((x) => x.name !== "getJob"),
]

const account = privateKeyToAccount(PK)
const publicClient = createPublicClient({ chain, transport: http(RPC) })
const walletClient = createWalletClient({ account, chain, transport: http(RPC) })

const priceWei = parseEther(PRICE)
const seen = new Set()

console.log(`[runner] agent ${account.address}`)
console.log(`[runner] market ${JOB_MARKET} · bid ${PRICE} RITUAL · poll ${POLL}s`)

async function readJob(id) {
  try {
    const j = await publicClient.readContract({
      address: JOB_MARKET,
      abi: JOB_ABI,
      functionName: "getJob",
      args: [id],
    })
    return j
  } catch {
    try {
      const j = await publicClient.readContract({
        address: JOB_MARKET,
        abi: JOB_ABI_ALT,
        functionName: "jobs",
        args: [id],
      })
      return {
        id: j[0],
        requester: j[1],
        provider: j[2],
        reward: j[3],
        bondRequired: j[4],
        status: j[5],
        deadline: j[6],
        taskData: j[7],
        resultData: j[8],
        rating: j[9],
      }
    } catch (e) {
      return null
    }
  }
}

async function jobCount() {
  try {
    return await publicClient.readContract({
      address: JOB_MARKET,
      abi: JOB_ABI,
      functionName: "jobCount",
    })
  } catch {
    // scan recent ids
    return 50n
  }
}

function decodeTask(hex) {
  if (!hex || hex === "0x") return ""
  try {
    return Buffer.from(hex.slice(2), "hex").toString("utf8")
  } catch {
    return hex
  }
}

async function tick() {
  const count = await jobCount()
  const n = Number(count)
  const start = Math.max(1, n - 30)
  for (let i = start; i <= n; i++) {
    const job = await readJob(BigInt(i))
    if (!job) continue
    const status = Number(job.status ?? job[5] ?? 0)
    const id = BigInt(job.id ?? i)
    const provider = (job.provider || "").toLowerCase()
    const me = account.address.toLowerCase()

    // OPEN = 0 typically
    if (status === 0 && !seen.has(`bid-${id}`)) {
      try {
        const hash = await walletClient.writeContract({
          address: JOB_MARKET,
          abi: JOB_ABI,
          functionName: "submitBid",
          args: [id, priceWei, EST_BLOCKS],
          account,
          chain,
        })
        console.log(`[bid] job #${id} tx ${hash}`)
        seen.add(`bid-${id}`)
      } catch (e) {
        console.log(`[bid-skip] #${id} ${e.shortMessage || e.message}`)
        seen.add(`bid-${id}`)
      }
    }

    // ASSIGNED / IN_PROGRESS for me
    if ((status === 1 || status === 2) && provider === me && !seen.has(`done-${id}`)) {
      try {
        if (status === 1) {
          const bond = job.bondRequired || 0n
          const h1 = await walletClient.writeContract({
            address: JOB_MARKET,
            abi: JOB_ABI,
            functionName: "startProcessing",
            args: [id],
            value: bond,
            account,
            chain,
          })
          console.log(`[start] #${id} ${h1}`)
        }
        const task = decodeTask(job.taskData)
        const result = `agent-runner result for job ${id}: ${task.slice(0, 200)}`
        const h2 = await walletClient.writeContract({
          address: JOB_MARKET,
          abi: JOB_ABI,
          functionName: "submitResult",
          args: [id, stringToHex(result)],
          account,
          chain,
        })
        console.log(`[result] #${id} ${h2}`)
        seen.add(`done-${id}`)
      } catch (e) {
        console.log(`[work-err] #${id} ${e.shortMessage || e.message}`)
      }
    }
  }
}

async function loop() {
  for (;;) {
    try {
      await tick()
    } catch (e) {
      console.error("[tick]", e.shortMessage || e.message)
    }
    await new Promise((r) => setTimeout(r, POLL * 1000))
  }
}

loop()

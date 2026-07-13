/**
 * End-to-end platform test with deployed sub-agents.
 * Uses keys from /tmp/pm-10-agents.json
 */
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { readFileSync } from "fs"

const RPC = "https://rpc.ritualfoundation.org"
const JOB_MARKET = "0xD4FD366d2C6884C5c76890a489Fc876CF5695E9A"
const STAKING = "0xdF186d42Ffe22246dB6FaE8d3E6AB29735ecfF18"
const HEARTBEAT = "0x157802f666233ffd2723b0596fa89824D1aea5aB"

const RITUAL = {
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
}

const stakingAbi = [
  { type: "function", name: "stake", stateMutability: "payable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "isAgentActive",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "getStake",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "lockedUntil", type: "uint256" },
      { name: "strikes", type: "uint256" },
      { name: "active", type: "bool" },
    ],
  },
]
const hbAbi = [{ type: "function", name: "ping", stateMutability: "nonpayable", inputs: [], outputs: [] }]
const marketAbi = [
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
    name: "getBids",
    stateMutability: "view",
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
  },
  {
    type: "function",
    name: "jobs",
    stateMutability: "view",
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
      { name: "rating", type: "uint256" },
      { name: "assignedAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "assignJob",
    stateMutability: "payable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "bidIndex", type: "uint256" },
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
  {
    type: "function",
    name: "rateProvider",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "rating", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "nextJobId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
]

const publicClient = createPublicClient({ chain: RITUAL, transport: http(RPC) })
const results = { pass: [], fail: [], info: [] }

function ok(msg) {
  results.pass.push(msg)
  console.log("PASS", msg)
}
function fail(msg, e) {
  const m = e?.shortMessage || e?.message || ""
  results.fail.push(`${msg}: ${m}`)
  console.log("FAIL", msg, m)
}
function info(msg) {
  results.info.push(msg)
  console.log("INFO", msg)
}

async function waitTx(hash, label) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120000 })
  if (receipt.status !== "success") throw new Error(`${label} reverted`)
  return receipt
}

async function write(wallet, req, label) {
  const hash = await wallet.writeContract({
    ...req,
    maxFeePerGas: 1_200_000_007n,
    maxPriorityFeePerGas: 1_000_000_000n,
  })
  await waitTx(hash, label)
  return hash
}

function walletOf(pk) {
  const account = privateKeyToAccount(pk)
  return {
    account,
    address: account.address,
    client: createWalletClient({ account, chain: RITUAL, transport: http(RPC) }),
  }
}

async function main() {
  const data = JSON.parse(readFileSync("/tmp/pm-10-agents.json", "utf8"))
  const agents = data.agents
  const openBid = agents.filter((a) => a.role === "open_bid")
  const solvers = agents.filter((a) => a.role === "solver")

  info(`loaded ${agents.length} agents (${openBid.length} open_bid, ${solvers.length} solvers)`)

  // 1) Stake all solvers (0.01)
  console.log("\n=== 1. Stake solvers ===")
  for (const s of solvers) {
    const w = walletOf(s.privateKey)
    const bal = await publicClient.getBalance({ address: w.address })
    info(`${s.name} bal=${formatEther(bal)}`)
    try {
      const active = await publicClient.readContract({
        address: STAKING,
        abi: stakingAbi,
        functionName: "isAgentActive",
        args: [w.address],
      })
      if (active) {
        ok(`${s.name} already staked/active`)
        s.staked = true
        continue
      }
      if (bal < parseEther("0.011")) {
        fail(`${s.name} stake`, new Error(`balance too low ${formatEther(bal)}`))
        continue
      }
      await write(
        w.client,
        {
          address: STAKING,
          abi: stakingAbi,
          functionName: "stake",
          args: [],
          value: parseEther("0.01"),
          account: w.account,
          chain: RITUAL,
        },
        "stake",
      )
      s.staked = true
      ok(`${s.name} staked 0.01`)
    } catch (e) {
      fail(`${s.name} stake`, e)
    }
  }

  // 2) Ping all agents
  console.log("\n=== 2. Heartbeat ping ===")
  for (const a of agents) {
    const w = walletOf(a.privateKey)
    try {
      await write(
        w.client,
        {
          address: HEARTBEAT,
          abi: hbAbi,
          functionName: "ping",
          args: [],
          account: w.account,
          chain: RITUAL,
        },
        "ping",
      )
      ok(`${a.name} ping`)
    } catch (e) {
      fail(`${a.name} ping`, e)
    }
  }

  // 3) Solvers bid on open jobs 3-7
  console.log("\n=== 3. Submit bids ===")
  const openJobs = [3n, 4n, 5n, 6n, 7n]
  const stakedSolvers = solvers.filter((s) => s.staked)
  info(`staked solvers: ${stakedSolvers.length}`)
  for (const jid of openJobs) {
    for (const s of stakedSolvers) {
      const w = walletOf(s.privateKey)
      try {
        // price slightly under typical reward
        await write(
          w.client,
          {
            address: JOB_MARKET,
            abi: marketAbi,
            functionName: "submitBid",
            args: [jid, parseEther("0.0003"), 80n],
            account: w.account,
            chain: RITUAL,
          },
          `bid ${jid}`,
        )
        ok(`${s.name} bid job #${jid}`)
      } catch (e) {
        // already bid / no skill / etc
        fail(`${s.name} bid #${jid}`, e)
      }
    }
    try {
      const bids = await publicClient.readContract({
        address: JOB_MARKET,
        abi: marketAbi,
        functionName: "getBids",
        args: [jid],
      })
      info(`job #${jid} total bids on-chain: ${bids.length}`)
    } catch (e) {
      fail(`getBids #${jid}`, e)
    }
  }

  // 4) Full lifecycle on one job if possible: assign (open bid agent) -> start+result (solver)
  console.log("\n=== 4. Lifecycle job #3 ===")
  try {
    const job = await publicClient.readContract({
      address: JOB_MARKET,
      abi: marketAbi,
      functionName: "jobs",
      args: [3n],
    })
    const status = Number(job[5] ?? job.status)
    const requester = (job[1] ?? job.requester).toLowerCase()
    info(`job#3 status=${status} requester=${requester}`)
    const bids = await publicClient.readContract({
      address: JOB_MARKET,
      abi: marketAbi,
      functionName: "getBids",
      args: [3n],
    })
    info(`job#3 bids=${bids.length}`)
    if (bids.length > 0 && status === 0) {
      // find open bid agent 1 key for assign
      const ob1 = openBid.find((a) => a.address.toLowerCase() === requester) || openBid[0]
      const reqW = walletOf(ob1.privateKey)
      await write(
        reqW.client,
        {
          address: JOB_MARKET,
          abi: marketAbi,
          functionName: "assignJob",
          args: [3n, 0n],
          account: reqW.account,
          chain: RITUAL,
        },
        "assignJob",
      )
      ok("assignJob #3 bid 0")

      const provider = (bids[0].provider || bids[0][0]).toLowerCase()
      const solver = solvers.find((s) => s.address.toLowerCase() === provider)
      if (solver) {
        const sw = walletOf(solver.privateKey)
        // bond ~ reward/10; use small value
        const bond = parseEther("0.0001")
        await write(
          sw.client,
          {
            address: JOB_MARKET,
            abi: marketAbi,
            functionName: "startProcessing",
            args: [3n],
            value: bond,
            account: sw.account,
            chain: RITUAL,
          },
          "startProcessing",
        )
        ok(`${solver.name} startProcessing #3`)

        const resultHex = ("0x" + Buffer.from("SOLVED: BTC sentiment neutral-bullish (platform test)", "utf8").toString("hex"))
        await write(
          sw.client,
          {
            address: JOB_MARKET,
            abi: marketAbi,
            functionName: "submitResult",
            args: [3n, resultHex],
            account: sw.account,
            chain: RITUAL,
          },
          "submitResult",
        )
        ok(`${solver.name} submitResult #3`)

        await write(
          reqW.client,
          {
            address: JOB_MARKET,
            abi: marketAbi,
            functionName: "rateProvider",
            args: [3n, 5n],
            account: reqW.account,
            chain: RITUAL,
          },
          "rateProvider",
        )
        ok("rateProvider #3 = 5")
      }
    } else {
      info(`skip lifecycle: status=${status} bids=${bids.length}`)
    }
  } catch (e) {
    fail("lifecycle job#3", e)
  }

  // 5) HTTP smoke
  console.log("\n=== 5. HTTP + UI smoke ===")
  const base = "https://ritual-agentry.vercel.app"
  const routes = ["/", "/dashboard", "/jobs", "/jobs/3", "/jobs/4", "/agents/5", "/agents/10", "/create", "/skills", "/analytics", "/docs", "/api/stats"]
  for (const r of routes) {
    try {
      const res = await fetch(base + r, { redirect: "follow" })
      if (res.ok) ok(`HTTP ${r} ${res.status}`)
      else fail(`HTTP ${r}`, new Error(`status ${res.status}`))
    } catch (e) {
      fail(`HTTP ${r}`, e)
    }
  }

  const stats = await (await fetch(base + "/api/stats")).json()
  info(`api stats agents=${stats.agentCount} block=${stats.block}`)
  if (Number(stats.agentCount) >= 10) ok("api agentCount >= 10")
  else fail("api agentCount", new Error(String(stats.agentCount)))

  // dashboard content
  const dash = await (await fetch(base + "/dashboard")).text()
  if (dash.includes("Solver Agent") || dash.includes("Open Bid")) ok("dashboard shows sub-agents")
  else fail("dashboard content", new Error("missing agent names"))

  const jobsPage = await (await fetch(base + "/jobs")).text()
  if (jobsPage.includes("OPEN") || jobsPage.includes("OPEN BID") || jobsPage.includes("job")) ok("jobs page loads marketplace")
  else fail("jobs page content", new Error("unexpected"))

  console.log("\n========== SUMMARY ==========")
  console.log(`PASS: ${results.pass.length}`)
  console.log(`FAIL: ${results.fail.length}`)
  if (results.fail.length) {
    console.log("Failures:")
    for (const f of results.fail) console.log(" -", f)
  }
  console.log(`INFO: ${results.info.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

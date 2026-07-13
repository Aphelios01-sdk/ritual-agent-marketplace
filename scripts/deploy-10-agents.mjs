/**
 * Deploy 10 sub-agents: 5 open-bid + 5 solvers.
 * PRIVATE_KEY=0x... node scripts/deploy-10-agents.mjs
 */
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  decodeEventLog,
} from "viem"
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
import { writeFileSync } from "fs"

const RPC = process.env.RITUAL_RPC_URL ?? "https://rpc.ritualfoundation.org"
const PK = process.env.PRIVATE_KEY
if (!PK) {
  console.error("PRIVATE_KEY required")
  process.exit(1)
}

const REGISTRY = "0x058756c754CAD054571933be57E3AADD3c3660F4"
const JOB_MARKET = "0xD4FD366d2C6884C5c76890a489Fc876CF5695E9A"
const STAKING = "0xdF186d42Ffe22246dB6FaE8d3E6AB29735ecfF18"
const HEARTBEAT = "0x157802f666233ffd2723b0596fa89824D1aea5aB"
const SK1 = "0x0000000000000000000000000000000000000000000000000000000000000001"
const SK2 = "0x0000000000000000000000000000000000000000000000000000000000000002"
const HTTP = "0x0000000000000000000000000000000000000801"
const LLM = "0x0000000000000000000000000000000000000802"

const RITUAL = {
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
}

const registryAbi = [
  {
    type: "function",
    name: "registerAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "agentContract", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "setSkills",
    stateMutability: "nonpayable",
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
  },
  {
    type: "function",
    name: "agentByContract",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "nextAgentId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "agentContract", type: "address", indexed: true },
    ],
  },
]

const marketAbi = [
  {
    type: "function",
    name: "requestService",
    stateMutability: "payable",
    inputs: [
      { name: "requiredSkillIds", type: "bytes32[]" },
      { name: "taskData", type: "bytes" },
    ],
    outputs: [{ type: "uint256" }],
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
    name: "nextJobId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
]

const stakingAbi = [
  { type: "function", name: "stake", stateMutability: "payable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "isAgentActive",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ type: "bool" }],
  },
]

const hbAbi = [
  { type: "function", name: "ping", stateMutability: "nonpayable", inputs: [], outputs: [] },
]

const publicClient = createPublicClient({ chain: RITUAL, transport: http(RPC) })
const funder = privateKeyToAccount(PK)
const funderWallet = createWalletClient({
  account: funder,
  chain: RITUAL,
  transport: http(RPC),
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitTx(hash, label) {
  console.log(`  ${label}: ${hash}`)
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 180_000 })
  if (receipt.status !== "success") throw new Error(`${label} REVERT`)
  return receipt
}

async function write(wallet, req, label) {
  // Use modest fees + optional gas. Prefer estimate (no huge prepaid gas lock).
  const hash = await wallet.writeContract({
    ...req,
    maxFeePerGas: req.maxFeePerGas ?? 1_200_000_007n,
    maxPriorityFeePerGas: req.maxPriorityFeePerGas ?? 1_000_000_000n,
  })
  return waitTx(hash, label)
}

async function ensureBalance(address, minWei, label) {
  const bal = await publicClient.getBalance({ address })
  if (bal >= minWei) return
  const need = minWei - bal + parseEther("0.00005")
  const hash = await funderWallet.sendTransaction({
    to: address,
    value: need,
    maxFeePerGas: 1_200_000_007n,
    maxPriorityFeePerGas: 1_000_000_000n,
  })
  await waitTx(hash, `topup ${label}`)
}

function skills(role) {
  const http = {
    skillId: SK1,
    name: "fetch-token-price",
    description: "Fetch real-time token price",
    precompileAddr: HTTP,
    configData: "0x",
    active: true,
  }
  const llm = {
    skillId: SK2,
    name: "sentiment-analysis",
    description: "Analyze sentiment with LLM",
    precompileAddr: LLM,
    configData: "0x",
    active: true,
  }
  return role === "solver" ? [http, llm] : [http]
}

const TASKS = [
  "OPEN BID: BTC 24h sentiment summary",
  "OPEN BID: ETH/USD price snapshot",
  "OPEN BID: Top DeFi TVL movers",
  "OPEN BID: Ritual network health brief",
  "OPEN BID: SOL vs ETH volatility note",
]

async function main() {
  let bal = await publicClient.getBalance({ address: funder.address })
  console.log(`Funder ${funder.address} bal=${formatEther(bal)}`)

  // Tight budget (~0.015 RITUAL): gas first, then open jobs; stake if leftover
  const GAS_FUND = parseEther("0.00115")
  const JOB_REWARD = parseEther("0.0004")
  const STAKE = parseEther("0.01")

  const agents = []
  for (let i = 1; i <= 10; i++) {
    const role = i <= 5 ? "open_bid" : "solver"
    const pk = generatePrivateKey()
    const account = privateKeyToAccount(pk)
    agents.push({
      i,
      role,
      pk,
      address: account.address,
      account,
      wallet: createWalletClient({ account, chain: RITUAL, transport: http(RPC) }),
      name: role === "open_bid" ? `Open Bid Agent ${i}` : `Solver Agent ${i - 5}`,
      staked: false,
      bids: 0,
      jobId: null,
      agentId: null,
    })
  }

  console.log("\n=== Fund wallets ===")
  for (const a of agents) {
    const hash = await funderWallet.sendTransaction({
      to: a.address,
      value: GAS_FUND,
      maxFeePerGas: 1_200_000_007n,
      maxPriorityFeePerGas: 1_000_000_000n,
    })
    await waitTx(hash, `fund ${a.name}`)
  }

  console.log("\n=== Register + skills + ping ===")
  for (const a of agents) {
    console.log(`\n[${a.role}] ${a.name} ${a.address}`)
    let id = await publicClient.readContract({
      address: REGISTRY,
      abi: registryAbi,
      functionName: "agentByContract",
      args: [a.address],
    })
    if (id === 0n) {
      await ensureBalance(a.address, parseEther("0.0006"), a.name)
      const receipt = await write(
        a.wallet,
        {
          address: REGISTRY,
          abi: registryAbi,
          functionName: "registerAgent",
          args: [
            a.name,
            `Sub-agent (${a.role}): ${a.name} on Ritual Agentry.`,
            a.address,
          ],
        },
        "register",
      )
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({ abi: registryAbi, data: log.data, topics: log.topics })
          if (ev.eventName === "AgentRegistered") id = ev.args.id
        } catch {
          /* skip */
        }
      }
      if (!id || id === 0n) {
        id = await publicClient.readContract({
          address: REGISTRY,
          abi: registryAbi,
          functionName: "agentByContract",
          args: [a.address],
        })
      }
    } else {
      console.log(`  already id=${id}`)
    }
    a.agentId = id.toString()
    console.log(`  agentId=${a.agentId}`)

    await ensureBalance(a.address, parseEther("0.0009"), `${a.name} skills`)
    await write(
      a.wallet,
      {
        address: REGISTRY,
        abi: registryAbi,
        functionName: "setSkills",
        args: [id, skills(a.role)],
      },
      "setSkills",
    )

    await ensureBalance(a.address, parseEther("0.0002"), `${a.name} ping`)
    await write(
      a.wallet,
      {
        address: HEARTBEAT,
        abi: hbAbi,
        functionName: "ping",
        args: [],
      },
      "ping",
    )
  }

  console.log("\n=== Stake solvers (optional) ===")
  bal = await publicClient.getBalance({ address: funder.address })
  for (const a of agents.filter((x) => x.role === "solver")) {
    bal = await publicClient.getBalance({ address: funder.address })
    if (bal < STAKE + parseEther("0.003")) {
      console.log(`  skip stake ${a.name}`)
      continue
    }
    const hash = await funderWallet.sendTransaction({
      to: a.address,
      value: STAKE + parseEther("0.00025"),
      maxFeePerGas: 1_200_000_007n,
      maxPriorityFeePerGas: 1_000_000_000n,
    })
    await waitTx(hash, `fund-stake ${a.name}`)
    try {
      await write(
        a.wallet,
        {
          address: STAKING,
          abi: stakingAbi,
          functionName: "stake",
          args: [],
          value: STAKE,
        },
        "stake",
      )
      a.staked = true
    } catch (e) {
      console.warn(`  stake fail ${a.name}:`, e.shortMessage || e.message)
    }
  }

  console.log("\n=== Post 5 OPEN BID jobs ===")
  const openers = agents.filter((a) => a.role === "open_bid")
  for (let i = 0; i < openers.length; i++) {
    const a = openers[i]
    await ensureBalance(a.address, JOB_REWARD + parseEther("0.0005"), `${a.name} job`)
    const taskHex = ("0x" + Buffer.from(TASKS[i], "utf8").toString("hex"))
    const skillIds = i % 2 === 0 ? [SK1, SK2] : [SK1]
    await write(
      a.wallet,
      {
        address: JOB_MARKET,
        abi: marketAbi,
        functionName: "requestService",
        args: [skillIds, taskHex],
        value: JOB_REWARD,
      },
      "requestService",
    )
    const jid = await publicClient.readContract({
      address: JOB_MARKET,
      abi: marketAbi,
      functionName: "nextJobId",
    })
    a.jobId = jid.toString()
    console.log(`  ${a.name} -> job #${a.jobId}`)
    await sleep(500)
  }

  console.log("\n=== Solver bids ===")
  const jobIds = openers.map((a) => BigInt(a.jobId)).filter(Boolean)
  for (const s of agents.filter((a) => a.role === "solver" && a.staked)) {
    for (const jid of jobIds.slice(0, 2)) {
      try {
        await ensureBalance(s.address, parseEther("0.0004"), `${s.name} bid`)
        await write(
          s.wallet,
          {
            address: JOB_MARKET,
            abi: marketAbi,
            functionName: "submitBid",
            args: [jid, parseEther("0.0004"), 60n],
          },
          `bid #${jid}`,
        )
        s.bids++
      } catch (e) {
        console.warn(`  bid fail ${s.name} job ${jid}:`, e.shortMessage || e.message)
      }
    }
  }

  const nextAgent = await publicClient.readContract({
    address: REGISTRY,
    abi: registryAbi,
    functionName: "nextAgentId",
  })
  const nextJob = await publicClient.readContract({
    address: JOB_MARKET,
    abi: marketAbi,
    functionName: "nextJobId",
  })
  const left = await publicClient.getBalance({ address: funder.address })

  const summary = {
    funder: funder.address,
    funderBalanceLeft: formatEther(left),
    nextAgentId: nextAgent.toString(),
    nextJobId: nextJob.toString(),
    openBid: agents
      .filter((a) => a.role === "open_bid")
      .map((a) => ({
        name: a.name,
        agentId: a.agentId,
        address: a.address,
        jobId: a.jobId,
      })),
    solvers: agents
      .filter((a) => a.role === "solver")
      .map((a) => ({
        name: a.name,
        agentId: a.agentId,
        address: a.address,
        staked: a.staked,
        bids: a.bids,
      })),
  }

  writeFileSync(
    "/tmp/pm-10-agents.json",
    JSON.stringify(
      {
        summary,
        agents: agents.map((a) => ({
          ...summary.openBid.find((x) => x.address === a.address),
          name: a.name,
          role: a.role,
          agentId: a.agentId,
          address: a.address,
          jobId: a.jobId,
          staked: a.staked,
          bids: a.bids,
          privateKey: a.pk,
        })),
      },
      null,
      2,
    ),
  )

  console.log("\n=== DONE ===")
  console.log(JSON.stringify(summary, null, 2))
  console.log("Keys: /tmp/pm-10-agents.json (not in git)")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

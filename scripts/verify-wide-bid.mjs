import { createWalletClient, createPublicClient, http, parseEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { readFileSync } from "fs"

const RPC = "https://rpc.ritualfoundation.org"
const JM = "0xD4FD366d2C6884C5c76890a489Fc876CF5695E9A"
const STAKING = "0xdF186d42Ffe22246dB6FaE8d3E6AB29735ecfF18"
const HB = "0x157802f666233ffd2723b0596fa89824D1aea5aB"
const RITUAL = {
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
}
const SK1 = "0x0000000000000000000000000000000000000000000000000000000000000001"
const SK2 = "0x0000000000000000000000000000000000000000000000000000000000000002"

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
    name: "nextJobId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
]
const hbAbi = [{ type: "function", name: "ping", stateMutability: "nonpayable", inputs: [], outputs: [] }]
const stakeAbi = [
  {
    type: "function",
    name: "isAgentActive",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "bool" }],
  },
]

const publicClient = createPublicClient({ chain: RITUAL, transport: http(RPC) })
const data = JSON.parse(readFileSync("/tmp/pm-10-agents.json", "utf8"))
const opener = data.agents.find((a) => a.role === "open_bid")
const solvers = data.agents.filter((a) => a.role === "solver")

function w(pk) {
  const account = privateKeyToAccount(pk)
  return {
    account,
    client: createWalletClient({ account, chain: RITUAL, transport: http(RPC) }),
  }
}

async function send(client, account, req, label) {
  const hash = await client.writeContract({
    ...req,
    account,
    chain: RITUAL,
    maxFeePerGas: 1200000007n,
    maxPriorityFeePerGas: 1000000000n,
  })
  const r = await publicClient.waitForTransactionReceipt({ hash })
  if (r.status !== "success") throw new Error(label + " revert")
  console.log("OK", label)
}

for (const s of solvers) {
  const sw = w(s.privateKey)
  await send(sw.client, sw.account, { address: HB, abi: hbAbi, functionName: "ping", args: [] }, `ping ${s.name}`)
}

const ow = w(opener.privateKey)
const taskHex = "0x" + Buffer.from("WIDE WINDOW: all 5 solvers bid test", "utf8").toString("hex")
await send(
  ow.client,
  ow.account,
  {
    address: JM,
    abi: marketAbi,
    functionName: "requestService",
    args: [[SK1, SK2], taskHex],
    value: parseEther("0.001"),
  },
  "post job",
)
const jid = await publicClient.readContract({
  address: JM,
  abi: marketAbi,
  functionName: "nextJobId",
})
console.log("job", jid.toString())

for (const s of solvers) {
  const sw = w(s.privateKey)
  const active = await publicClient.readContract({
    address: STAKING,
    abi: stakeAbi,
    functionName: "isAgentActive",
    args: [sw.account.address],
  })
  console.log(s.name, "active", active)
  try {
    await send(
      sw.client,
      sw.account,
      {
        address: JM,
        abi: marketAbi,
        functionName: "submitBid",
        args: [jid, parseEther("0.0007"), 40n],
      },
      `${s.name} bid`,
    )
  } catch (e) {
    console.log("FAIL", s.name, e.shortMessage || e.message)
  }
}
const bids = await publicClient.readContract({
  address: JM,
  abi: marketAbi,
  functionName: "getBids",
  args: [jid],
})
console.log(`SUCCESS bids on job #${jid}: ${bids.length}/5`)

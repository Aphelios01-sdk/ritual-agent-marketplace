import { NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "@/lib/constants"
import { JOB_MARKET_V2_ABI } from "@/lib/contract-abi-v2"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const client = createPublicClient({
  chain: RITUAL_CHAIN,
  transport: http(),
})

const JOB_MARKET_V2 = CONTRACT_ADDRESSES.jobMarketV2 as `0x${string}`

// Pull event definitions directly from the canonical ABI so parameter names always match.
const EVENT_ABIS = JOB_MARKET_V2_ABI.filter(
  (e) => e.type === "event" && ["JobRequested", "JobAssigned", "JobCompleted", "JobDisputed", "BidSubmitted"].includes(e.name),
) as any

export async function GET() {
  try {
    const block = await client.getBlockNumber()
    const fromBlock = block - BigInt(500)

    const logs = await client.getLogs({
      address: JOB_MARKET_V2,
      events: EVENT_ABIS,
      fromBlock,
      toBlock: block,
    })

    const events = logs.map((log: any) => {
      const blockNum = log.blockNumber ? Number(log.blockNumber) : 0
      const name = log.eventName || ""
      const args = log.args || {}

      let summary = ""
      let jobRef = "?"
      if (name === "JobRequested") {
        jobRef = String(args.id ?? "?")
        summary = `Job #${jobRef} requested by ${(args.requester || "").slice(0, 10)}…`
      } else if (name === "JobAssigned") {
        jobRef = String(args.jobId ?? "?")
        summary = `Job #${jobRef} → ${(args.provider || "").slice(0, 10)}…`
      } else if (name === "JobCompleted") {
        jobRef = String(args.id ?? "?")
        summary = `Job #${jobRef} completed`
      } else if (name === "JobDisputed") {
        jobRef = String(args.id ?? "?")
        summary = `Job #${jobRef} disputed`
      } else if (name === "BidSubmitted") {
        jobRef = String(args.jobId ?? "?")
        summary = `Bid #${jobRef} by ${(args.provider || "").slice(0, 10)}…`
      }

      return { name, block: blockNum, summary }
    })

    return NextResponse.json({
      block: block.toString(),
      events: events.slice(-20),
    })
  } catch (e: any) {
    return NextResponse.json({ error: "events-unreachable", detail: String(e?.message || e) }, { status: 502 })
  }
}

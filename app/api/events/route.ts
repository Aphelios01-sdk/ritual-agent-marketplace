import { NextResponse } from "next/server"
import { createPublicClient, http, decodeEventLog } from "viem"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "@/lib/constants"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const client = createPublicClient({
  chain: RITUAL_CHAIN,
  transport: http(),
})

const JOB_MARKET_V2 = CONTRACT_ADDRESSES.jobMarketV2 as `0x${string}`

const EVENT_NAMES: Record<string, string> = {
  "0x9cb5a5f9ef5c4c028b9e43b860f0c5d60b9eb00e9a5b09ea718f9589c25d661": "JobRequested",
  "0x0427e4d1343f4ecb849460cf8370ab14a4ce573525b44bbe8a5f09f23e7c16f8": "JobAssigned",
  "0x3b9e6c0a6d4e99a46dbbc646e7f4ac5c7c581a415a0e80bf95860d6c9bb86c3": "JobCompleted",
  "0x5b1c22ab4b2842386dce1531a217ed1d717b038b89925db35bbc2911673026bb": "JobDisputed",
  "0x1a676c15e9762fafb2e4acdd8a82f595c6da30d47f2e8e4b909ed1ea46a37b2": "BidSubmitted",
}

export async function GET() {
  try {
    const block = await client.getBlockNumber()
    const fromBlock = block - BigInt(500)

    // Fetch raw logs for all relevant event signatures
    const logs = await client.getLogs({
      address: JOB_MARKET_V2,
      events: [
        { type: "event", name: "JobRequested", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256", indexed: false }, { type: "bytes32[]", indexed: false }] },
        { type: "event", name: "JobAssigned", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256", indexed: false }] },
        { type: "event", name: "JobCompleted", inputs: [{ type: "uint256", indexed: true }, { type: "bytes", indexed: false }] },
        { type: "event", name: "JobDisputed", inputs: [{ type: "uint256", indexed: true }] },
        { type: "event", name: "BidSubmitted", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256", indexed: false }, { type: "uint256", indexed: false }] },
      ] as const,
      fromBlock,
      toBlock: block,
    })

    const events = logs.map((log: any) => {
      const blockNum = log.blockNumber ? Number(log.blockNumber) : 0
      const name = log.eventName || ""
      const args = log.args || {}

      let summary = ""
      if (name === "JobRequested") {
        summary = `Job #${args.id} requested by ${(args.requester || "").slice(0, 10)}…`
      } else if (name === "JobAssigned") {
        summary = `Job #${args.id} → ${(args.provider || "").slice(0, 10)}…`
      } else if (name === "JobCompleted") {
        summary = `Job #${args.id} completed`
      } else if (name === "JobDisputed") {
        summary = `Job #${args.id} disputed`
      } else if (name === "BidSubmitted") {
        summary = `Bid #${args.jobId} by ${(args.provider || "").slice(0, 10)}…`
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

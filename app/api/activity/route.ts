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

const EVENT_ABIS = JOB_MARKET_V2_ABI.filter(
  (e) =>
    e.type === "event" &&
    ["JobRequested", "JobAssigned", "JobCompleted", "JobDisputed", "BidSubmitted"].includes(
      e.name as string,
    ),
) as any

export async function GET() {
  try {
    const block = await client.getBlockNumber()
    const fromBlock = block > BigInt(800) ? block - BigInt(800) : BigInt(0)

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
        jobRef = String(args.id ?? args.jobId ?? "?")
        summary = `Job #${jobRef} posted by ${short(args.requester)}`
      } else if (name === "JobAssigned") {
        jobRef = String(args.jobId ?? args.id ?? "?")
        summary = `Job #${jobRef} assigned → ${short(args.provider)}`
      } else if (name === "JobCompleted") {
        jobRef = String(args.id ?? args.jobId ?? "?")
        summary = `Job #${jobRef} completed · escrow released`
      } else if (name === "JobDisputed") {
        jobRef = String(args.id ?? args.jobId ?? "?")
        summary = `Job #${jobRef} disputed · council opens`
      } else if (name === "BidSubmitted") {
        jobRef = String(args.jobId ?? args.id ?? "?")
        summary = `Bid on job #${jobRef} by ${short(args.provider)}`
      }

      return {
        name,
        block: blockNum,
        summary,
        jobRef,
        tx: log.transactionHash,
      }
    })

    return NextResponse.json({
      block: block.toString(),
      events: events.slice(-60),
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: "activity-unreachable", detail: String(e?.message || e) },
      { status: 502 },
    )
  }
}

function short(addr?: string) {
  if (!addr || typeof addr !== "string") return "0x…"
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

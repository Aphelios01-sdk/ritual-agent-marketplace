import { NextResponse } from "next/server"
import { createPublicClient, http, type AbiEvent } from "viem"
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
) as AbiEvent[]

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

    const events = logs.map((log) => {
      const blockNum = log.blockNumber ? Number(log.blockNumber) : 0
      const name = log.eventName || ""
      const args = (log.args ?? {}) as Record<string, unknown>
      const addr = (v: unknown) => (typeof v === "string" ? v : "")
      const ref = (...keys: string[]) => {
        for (const k of keys) {
          const v = args[k]
          if (v !== undefined && v !== null) return String(v)
        }
        return "?"
      }

      let summary = ""
      let jobRef = "?"
      if (name === "JobRequested") {
        jobRef = ref("id", "jobId")
        summary = `Job #${jobRef} posted by ${short(addr(args.requester))}`
      } else if (name === "JobAssigned") {
        jobRef = ref("jobId", "id")
        summary = `Job #${jobRef} assigned → ${short(addr(args.provider))}`
      } else if (name === "JobCompleted") {
        jobRef = ref("id", "jobId")
        summary = `Job #${jobRef} completed · escrow released`
      } else if (name === "JobDisputed") {
        jobRef = ref("id", "jobId")
        summary = `Job #${jobRef} disputed · council opens`
      } else if (name === "BidSubmitted") {
        jobRef = ref("jobId", "id")
        summary = `Bid on job #${jobRef} by ${short(addr(args.provider))}`
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
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "activity-unreachable", detail },
      { status: 502 },
    )
  }
}

function short(addr?: string) {
  if (!addr || typeof addr !== "string") return "0x…"
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

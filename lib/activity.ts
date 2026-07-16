import { createPublicClient, http, type AbiEvent } from "viem"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "./constants"
import { JOB_MARKET_V2_ABI } from "./contract-abi-v2"

const RPC = process.env.RITUAL_RPC_URL || RITUAL_CHAIN.rpcUrls.default.http[0]

const client = createPublicClient({
  chain: RITUAL_CHAIN,
  transport: http(RPC, { timeout: 12_000 }),
})

const JOB_MARKET_V2 = CONTRACT_ADDRESSES.jobMarketV2 as `0x${string}`

const EVENT_ABIS = JOB_MARKET_V2_ABI.filter(
  (e) =>
    e.type === "event" &&
    ["JobRequested", "JobAssigned", "JobCompleted", "JobDisputed", "BidSubmitted"].includes(
      e.name as string,
    ),
) as AbiEvent[]

/** Default lookback — larger window for quieter chains; fetched in chunks for RPC limits. */
const DEFAULT_RANGE_BLOCKS = 50_000
const CHUNK_BLOCKS = 2_000

export type FeedEvent = {
  name: string
  block: number
  summary: string
  jobRef: string
  tx?: string
}

function short(addr?: string) {
  if (!addr || typeof addr !== "string") return "0x…"
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

async function getLogsChunked(fromBlock: bigint, toBlock: bigint) {
  const logs: Awaited<ReturnType<typeof client.getLogs>> = []
  let cursor = fromBlock
  while (cursor <= toBlock) {
    const chunkEnd = cursor + BigInt(CHUNK_BLOCKS) - BigInt(1)
    const end = chunkEnd > toBlock ? toBlock : chunkEnd
    try {
      const chunk = await client.getLogs({
        address: JOB_MARKET_V2,
        events: EVENT_ABIS,
        fromBlock: cursor,
        toBlock: end,
      })
      logs.push(...chunk)
    } catch {
      /* skip failed chunk — partial results beat a hung feed */
    }
    cursor = end + BigInt(1)
  }
  return logs
}

/**
 * Read recent JobMarketV2 events for the activity feed.
 * Shared by /api/activity (polling) and the /activity page (SSR seed)
 * so first paint already shows events instead of a client-only spinner.
 */
export async function fetchRecentActivity(rangeBlocks = DEFAULT_RANGE_BLOCKS): Promise<{
  block: string
  events: FeedEvent[]
}> {
  const block = await client.getBlockNumber()
  const fromBlock = block > BigInt(rangeBlocks) ? block - BigInt(rangeBlocks) : BigInt(0)

  const logs = await getLogsChunked(fromBlock, block)

  const events: FeedEvent[] = logs.map((raw) => {
    const log = raw as {
      blockNumber?: bigint | null
      eventName?: string
      args?: Record<string, unknown>
      transactionHash?: string | null
    }
    const blockNum = log.blockNumber ? Number(log.blockNumber) : 0
    const name = log.eventName || ""
    const args = log.args ?? {}
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
      tx: log.transactionHash || undefined,
    }
  })

  return {
    block: block.toString(),
    events: events.slice(-60),
  }
}
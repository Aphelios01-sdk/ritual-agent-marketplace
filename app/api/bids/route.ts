import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "@/lib/constants"
import { JOB_MARKET_V2_ABI } from "@/lib/contract-abi-v2"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const SIGNER_PK = process.env.SERVER_SIGNER_PK || ""

const JOB_MARKET = CONTRACT_ADDRESSES.jobMarketV2 as `0x${string}`

export async function POST(req: NextRequest) {
  if (!SIGNER_PK) {
    return NextResponse.json({ error: "SERVER_SIGNER_PK not configured" }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { jobId, priceWei, estBlocks } = body

    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 })
    }
    const price = priceWei ? BigInt(priceWei) : BigInt(0)
    if (price <= BigInt(0)) {
      return NextResponse.json({ error: "priceWei must be > 0" }, { status: 400 })
    }
    const blocks = estBlocks ? BigInt(estBlocks) : BigInt(100)

    const account = privateKeyToAccount(SIGNER_PK as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: RITUAL_CHAIN, transport: http() })

    const hash = await walletClient.writeContract({
      address: JOB_MARKET,
      abi: JOB_MARKET_V2_ABI,
      functionName: "submitBid",
      args: [BigInt(jobId), price, blocks],
      account,
    })

    return NextResponse.json({ ok: true, txHash: hash, jobId, priceWei: price.toString() })
  } catch (e: any) {
    const msg = e?.shortMessage || e?.message || String(e)
    return NextResponse.json({ error: "bid relay failed", detail: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "@/lib/constants"
import { JOB_MARKET_V2_ABI } from "@/lib/contract-abi-v2"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const SIGNER_PK = process.env.SERVER_SIGNER_PK || ""

const publicClient = createPublicClient({
  chain: RITUAL_CHAIN,
  transport: http(),
})

const JOB_MARKET = CONTRACT_ADDRESSES.jobMarketV2 as `0x${string}`

export async function POST(req: NextRequest) {
  if (!SIGNER_PK) {
    return NextResponse.json({ error: "SERVER_SIGNER_PK not configured" }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { requiredSkillIds, taskData, rewardWei } = body

    if (!Array.isArray(requiredSkillIds) || requiredSkillIds.length === 0) {
      return NextResponse.json({ error: "requiredSkillIds must be a non-empty array" }, { status: 400 })
    }
    if (!taskData?.trim()) {
      return NextResponse.json({ error: "taskData required" }, { status: 400 })
    }

    // Encode taskData as hex bytes
    const taskHex = ("0x" + Buffer.from(taskData, "utf8").toString("hex")) as `0x${string}`
    const reward = rewardWei ? BigInt(rewardWei) : BigInt(0)
    if (reward <= BigInt(0)) {
      return NextResponse.json({ error: "rewardWei must be > 0" }, { status: 400 })
    }

    const account = privateKeyToAccount(SIGNER_PK as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: RITUAL_CHAIN, transport: http() })

    const hash = await walletClient.writeContract({
      address: JOB_MARKET,
      abi: JOB_MARKET_V2_ABI,
      functionName: "requestService",
      args: [requiredSkillIds, taskHex],
      value: reward,
      account,
    })

    return NextResponse.json({ ok: true, txHash: hash, relayedBy: account.address, rewardWei: reward.toString() })
  } catch (e: any) {
    const msg = e?.shortMessage || e?.message || String(e)
    return NextResponse.json({ error: "relay failed", detail: msg }, { status: 500 })
  }
}

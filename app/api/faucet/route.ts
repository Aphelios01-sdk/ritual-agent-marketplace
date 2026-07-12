import { NextResponse } from "next/server"
import { createWalletClient, createPublicClient, http, parseEther, type Address } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { RITUAL_CHAIN } from "@/lib/constants"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const FAUCET_PK = process.env.FAUCET_PRIVATE_KEY as `0x${string}` | undefined
const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || "0.05"
const COOLDOWN_MS = 60 * 60 * 1000 // 1h per address
const hits = new Map<string, number>()

export async function GET() {
  const client = createPublicClient({
    chain: RITUAL_CHAIN,
    transport: http(),
  })
  let faucetAddress: string | null = null
  let balance: string | null = null
  if (FAUCET_PK && FAUCET_PK.length === 66) {
    try {
      const account = privateKeyToAccount(FAUCET_PK)
      faucetAddress = account.address
      const bal = await client.getBalance({ address: account.address })
      balance = bal.toString()
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json({
    enabled: Boolean(FAUCET_PK),
    amount: FAUCET_AMOUNT,
    symbol: "RITUAL",
    chainId: RITUAL_CHAIN.id,
    faucetAddress,
    balance,
    cooldownMs: COOLDOWN_MS,
    explorer: RITUAL_CHAIN.blockExplorers.default.url,
    tip: FAUCET_PK
      ? "POST { address } to claim test RITUAL"
      : "Set FAUCET_PRIVATE_KEY env to enable automatic drips. Manual: fund your agent wallet from Ritual faucet/community.",
  })
}

export async function POST(req: Request) {
  if (!FAUCET_PK || FAUCET_PK.length !== 66) {
    return NextResponse.json(
      {
        error: "faucet-disabled",
        message: "FAUCET_PRIVATE_KEY not configured. Fund the agent wallet manually.",
      },
      { status: 503 },
    )
  }

  try {
    const body = await req.json()
    const address = String(body.address || "") as Address
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "invalid address" }, { status: 400 })
    }

    const key = address.toLowerCase()
    const last = hits.get(key) || 0
    if (Date.now() - last < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000)
      return NextResponse.json({ error: "cooldown", waitSeconds: wait }, { status: 429 })
    }

    const account = privateKeyToAccount(FAUCET_PK)
    const wallet = createWalletClient({
      account,
      chain: RITUAL_CHAIN,
      transport: http(),
    })
    const hash = await wallet.sendTransaction({
      to: address,
      value: parseEther(FAUCET_AMOUNT),
      chain: RITUAL_CHAIN,
      account,
    })
    hits.set(key, Date.now())
    return NextResponse.json({ ok: true, txHash: hash, amount: FAUCET_AMOUNT })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.shortMessage || e?.message || e) }, { status: 500 })
  }
}

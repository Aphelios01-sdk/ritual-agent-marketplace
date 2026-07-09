import { NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "@/lib/constants"
import { AGENT_REGISTRY_ABI } from "@/lib/contract-abi"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const RPC = process.env.RITUAL_RPC_URL || RITUAL_CHAIN.rpcUrls.default.http[0]

const client = createPublicClient({
  chain: RITUAL_CHAIN,
  transport: http(RPC, { timeout: 8_000 }),
})

const REGISTRY = CONTRACT_ADDRESSES.agentRegistry

// Lightweight live snapshot for dashboard polling: block number + chain id + agent count.
export async function GET() {
  try {
    const [block, chainId, nextAgentId] = await Promise.all([
      client.getBlockNumber(),
      client.getChainId(),
      client.readContract({
        address: REGISTRY,
        abi: AGENT_REGISTRY_ABI,
        functionName: "nextAgentId",
      }) as Promise<bigint>,
    ])
    return NextResponse.json(
      {
        block: block.toString(),
        chainId: Number(chainId),
        agentCount: Number(nextAgentId),
        ts: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch {
    return NextResponse.json({ error: "rpc-unreachable" }, { status: 502 })
  }
}

import { NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import {
  RITUAL_CHAIN,
  RITUAL_AVG_BLOCK_MS,
  CONTRACT_ADDRESSES,
} from "@/lib/constants"
import { AGENT_REGISTRY_ABI } from "@/lib/contract-abi"
import { JOB_MARKET_V2_ABI } from "@/lib/contract-abi-v2"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const RPC = process.env.RITUAL_RPC_URL || RITUAL_CHAIN.rpcUrls.default.http[0]

const client = createPublicClient({
  chain: RITUAL_CHAIN,
  transport: http(RPC, { timeout: 6_000 }),
})

type Check = { ok: boolean; ms?: number; detail?: string }

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T | null; ms: number; error?: string }> {
  const start = Date.now()
  try {
    const value = await fn()
    return { value, ms: Date.now() - start }
  } catch (e) {
    return { value: null, ms: Date.now() - start, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function GET() {
  const startedAt = Date.now()

  const rpc = await timed(() =>
    Promise.all([
      client.getBlockNumber(),
      client.getChainId(),
    ]),
  )

  const block = rpc.value?.[0] ?? null
  const chainId = rpc.value?.[1] ?? null

  const registry = await timed(() =>
    client.readContract({
      address: CONTRACT_ADDRESSES.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "nextAgentId",
    }) as Promise<bigint>,
  )

  const jobMarket = await timed(() =>
    client.readContract({
      address: CONTRACT_ADDRESSES.jobMarketV2,
      abi: JOB_MARKET_V2_ABI,
      functionName: "nextJobId",
    }) as Promise<bigint>,
  )

  const rpcCheck: Check = {
    ok: block !== null,
    ms: rpc.ms,
    detail: block !== null ? `head ${block.toString()}` : rpc.error,
  }
  const registryCheck: Check = {
    ok: registry.value !== null,
    ms: registry.ms,
    detail: registry.value !== null ? `nextAgentId ${registry.value.toString()}` : registry.error,
  }
  const jobMarketCheck: Check = {
    ok: jobMarket.value !== null,
    ms: jobMarket.ms,
    detail: jobMarket.value !== null ? `nextJobId ${jobMarket.value.toString()}` : jobMarket.error,
  }

  const checks = { rpc: rpcCheck, registry: registryCheck, jobMarket: jobMarketCheck }
  const ok = Object.values(checks).every((c) => c.ok)

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      ok,
      chainId: chainId != null ? Number(chainId) : RITUAL_CHAIN.id,
      chainName: RITUAL_CHAIN.name,
      rpc: RPC.replace(/^https?:\/\//, ""),
      block: block ? Number(block) : null,
      blockMs: RITUAL_AVG_BLOCK_MS,
      contracts: {
        agentRegistry: CONTRACT_ADDRESSES.agentRegistry,
        jobMarketV2: CONTRACT_ADDRESSES.jobMarketV2,
        agentDirectory: CONTRACT_ADDRESSES.agentDirectory,
        disputeCouncil: CONTRACT_ADDRESSES.disputeCouncil,
      },
      explorer: RITUAL_CHAIN.blockExplorers.default.url,
      checks,
      latencyMs: {
        rpc: rpc.ms,
        registry: registry.ms,
        jobMarket: jobMarket.ms,
      },
      totalMs: Date.now() - startedAt,
      ts: Date.now(),
    },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  )
}

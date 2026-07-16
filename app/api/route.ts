import { NextResponse } from "next/server"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "@/lib/constants"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const endpoints = [
  { path: "/api/health", desc: "RPC head, latency, contract probes, explorer" },
  { path: "/api/stats", desc: "Live block, chainId, agent count (dashboard polling)" },
  { path: "/api/activity", desc: "Recent JobMarketV2 events (feed)" },
  { path: "/api/jobs", desc: "Job + bids by ?id=" },
  { path: "/api/events", desc: "Raw event log reader" },
  { path: "/api/skill-demo", desc: "Skill demo payload" },
]

export async function GET() {
  return NextResponse.json(
    {
      name: "Ritual Agentry API",
      chain: { id: RITUAL_CHAIN.id, name: RITUAL_CHAIN.name },
      explorer: RITUAL_CHAIN.blockExplorers.default.url,
      contracts: {
        agentRegistry: CONTRACT_ADDRESSES.agentRegistry,
        jobMarketV2: CONTRACT_ADDRESSES.jobMarketV2,
        agentDirectory: CONTRACT_ADDRESSES.agentDirectory,
      },
      endpoints,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  )
}

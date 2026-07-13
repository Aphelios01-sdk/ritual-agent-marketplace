"use client"

import { McpActionPanel } from "@/components/mcp-action-panel"
import { CONTRACT_ADDRESSES } from "@/lib/constants"
import { useT } from "@/lib/i18n/context"

export default function BondPage() {
  const t = useT()
  return (
    <div className="inf-container max-w-2xl py-8 md:py-14">
      <p className="inf-eyebrow mb-2">{t.bondPage.eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{t.bondPage.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.bondPage.body}</p>
      <div className="mt-8">
        <McpActionPanel surface="bond" title={t.bondPage.toolsTitle} />
      </div>
      <p className="mt-6 font-mono text-[11px] text-muted-foreground">
        AgentStaking {CONTRACT_ADDRESSES.agentStaking}
        <br />
        AgentHeartbeat {CONTRACT_ADDRESSES.agentHeartbeat}
      </p>
    </div>
  )
}

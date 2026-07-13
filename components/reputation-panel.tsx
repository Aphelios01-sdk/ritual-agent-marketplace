"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Shield, Star, AlertTriangle, Loader2 } from "lucide-react"
import { readReputation, readStake } from "@/lib/agent-wallet"
import { formatRitual } from "@/lib/utils"
import type { Address } from "viem"

export function ReputationPanel({
  address,
  jobCount = 0,
  avgRating = 0,
}: {
  address: string
  jobCount?: number
  avgRating?: number
}) {
  const [rep, setRep] = useState<{ score: bigint; reviewCount: bigint; lastUpdate: bigint } | null>(
    null,
  )
  const [stake, setStake] = useState<{
    amount: bigint
    lockedUntil: bigint
    strikes: bigint
    active: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let dead = false
    ;(async () => {
      setLoading(true)
      const [r, s] = await Promise.all([
        readReputation(address as Address),
        readStake(address as Address),
      ])
      if (dead) return
      setRep(r)
      setStake(s)
      setLoading(false)
    })()
    return () => {
      dead = true
    }
  }, [address])

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 p-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading reputation…
      </div>
    )
  }

  const score = rep ? Number(rep.score) : Math.round(avgRating * 100)
  const reviews = rep ? Number(rep.reviewCount) : 0
  const bond = stake?.amount ?? BigInt(0)
  const strikes = stake ? Number(stake.strikes) : 0

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-[#00ff99]" />
        <p className="text-sm font-semibold">Reputation breakdown</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Score" value={String(score)} icon={<Star className="h-3 w-3" />} />
        <Stat label="On chain reviews" value={String(reviews)} />
        <Stat label="Jobs (registry)" value={String(jobCount)} />
        <Stat label="Avg rating" value={avgRating ? avgRating.toFixed(2) : "·"} />
        <Stat label="Bond locked" value={formatRitual(bond)} />
        <Stat label="Strikes" value={String(strikes)} tone={strikes > 0 ? "text-red-400" : undefined} />
        <Stat label="Stake active" value={stake?.active ? "Yes" : "No"} />
        <Stat
          label="Locked until"
          value={stake && stake.lockedUntil > BigInt(0) ? String(stake.lockedUntil) : "·"}
        />
      </div>
      {strikes > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertTriangle className="h-3 w-3" /> Agent has slash strikes on record.
        </p>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon?: ReactNode
  tone?: string
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 flex items-center gap-1 text-sm font-semibold tabular-nums ${tone || ""}`}>
        {icon}
        {value}
      </p>
    </div>
  )
}

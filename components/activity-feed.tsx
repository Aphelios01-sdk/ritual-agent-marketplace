"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/context"

export type FeedEvent = {
  name: string
  block: number
  summary: string
  jobRef?: string
}

const TONE: Record<string, string> = {
  JobRequested: "text-[#00c3ff]",
  BidSubmitted: "text-[#00ff99]",
  JobAssigned: "text-yellow-400",
  JobCompleted: "text-emerald-400",
  JobDisputed: "text-red-400",
}

export function ActivityFeed({
  compact = false,
  pollMs = 6_000,
  className,
}: {
  compact?: boolean
  pollMs?: number
  className?: string
}) {
  const t = useT()
  const p = t.activityPage
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [block, setBlock] = useState<string>("—")
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let dead = false
    const load = async () => {
      try {
        const res = await fetch("/api/activity", { cache: "no-store" })
        if (!res.ok) throw new Error("activity failed")
        const data = await res.json()
        if (dead) return
        setEvents((data.events || []).slice().reverse())
        setBlock(data.block || "—")
        setErr(null)
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e.message : "failed")
      } finally {
        if (!dead) setLoading(false)
      }
    }
    load()
    const t = setInterval(load, pollMs)
    return () => {
      dead = true
      clearInterval(t)
    }
  }, [pollMs])

  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card/40", className)}>
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#00ff99]" />
          <p className="text-sm font-semibold">{p.feedTitle}</p>
          <span className="okx-pulse-dot h-1.5 w-1.5 rounded-full bg-[#00ff99]" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {p.block} {block}
        </span>
      </div>
      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {p.loading}
        </div>
      )}
      {err && !loading && (
        <p className="px-4 py-8 text-center text-xs text-red-400">{err}</p>
      )}
      <ul className={cn("divide-y divide-border/30", compact ? "max-h-64 overflow-y-auto" : "")}>
        {events.map((e, i) => (
          <li key={`${e.block}-${e.name}-${i}`} className="flex items-start gap-3 px-4 py-3">
            <span
              className={cn(
                "mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current",
                TONE[e.name] || "text-muted-foreground",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug">{e.summary}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <span className={TONE[e.name] || ""}>{e.name}</span>
                <span>·</span>
                <span>#{e.block}</span>
                {e.jobRef && e.jobRef !== "?" && (
                  <>
                    <span>·</span>
                    <Link href={`/jobs/${e.jobRef}`} className="text-[#00ff99] hover:underline">
                      job #{e.jobRef}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
        {!loading && events.length === 0 && (
          <li className="px-4 py-10 text-center text-xs text-muted-foreground">{p.empty}</li>
        )}
      </ul>
    </div>
  )
}

"use client"

import Link from "next/link"
import { Trophy } from "lucide-react"
import { useT } from "@/lib/i18n/context"

export type LeaderboardRow = {
  rank: number
  name: string
  href: string
  meta: string
}

export function LeaderboardPageClient({
  earners,
  rated,
  active,
}: {
  earners: LeaderboardRow[]
  rated: LeaderboardRow[]
  active: LeaderboardRow[]
}) {
  const t = useT()
  const p = t.leaderboardPage

  return (
    <div className="inf-container py-10 md:py-14">
      <div className="mb-8 flex items-start gap-3">
        <Trophy className="mt-1 h-6 w-6 text-[#00ff99]" />
        <div>
          <p className="inf-eyebrow mb-2">{p.compete}</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{p.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Board title={p.topEarners} rows={earners} empty={p.empty} />
        <Board title={p.topRated} rows={rated} empty={p.empty} />
        <Board title={p.mostActive} rows={active} empty={p.empty} />
      </div>
    </div>
  )
}

function Board({
  title,
  rows,
  empty,
}: {
  title: string
  rows: LeaderboardRow[]
  empty: string
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40">
      <div className="border-b border-border/40 px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <ol className="divide-y divide-border/30">
        {rows.length === 0 && (
          <li className="px-4 py-8 text-center text-xs text-muted-foreground">{empty}</li>
        )}
        {rows.map((r) => (
          <li key={r.href + r.rank} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/50 font-mono text-xs text-muted-foreground">
              {r.rank}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={r.href} className="truncate text-sm font-medium hover:text-[#00ff99]">
                {r.name}
              </Link>
              <p className="truncate text-[11px] text-muted-foreground">{r.meta}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

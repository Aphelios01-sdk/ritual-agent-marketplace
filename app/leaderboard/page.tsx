import type { Metadata } from "next"
import Link from "next/link"
import { Trophy } from "lucide-react"
import { fetchAgents, fetchJobs } from "@/lib/onchain"
import { formatRating, formatRitual, shortAddress } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top agents by earnings, ratings, and completed jobs on Prompt Market.",
}

export const revalidate = 8

export default async function LeaderboardPage() {
  const [agents, jobs] = await Promise.all([fetchAgents(), fetchJobs()])

  const completedByProvider = new Map<string, number>()
  const earnedByProvider = new Map<string, bigint>()
  for (const j of jobs) {
    if (j.status !== "COMPLETED") continue
    const p = j.provider.toLowerCase()
    if (p === "0x0000000000000000000000000000000000000000") continue
    completedByProvider.set(p, (completedByProvider.get(p) || 0) + 1)
    earnedByProvider.set(p, (earnedByProvider.get(p) || BigInt(0)) + j.reward)
  }

  const ranked = [...agents]
    .map((a) => {
      const key = a.contractAddress.toLowerCase()
      return {
        ...a,
        completed: completedByProvider.get(key) || a.jobCount || 0,
        earned: earnedByProvider.get(key) || a.totalEarnings || BigInt(0),
      }
    })
    .sort((a, b) => {
      if (b.earned !== a.earned) return b.earned > a.earned ? 1 : -1
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
      return b.completed - a.completed
    })

  const byRating = [...agents].sort((a, b) => b.avgRating - a.avgRating || b.jobCount - a.jobCount)
  const byJobs = [...agents].sort((a, b) => b.jobCount - a.jobCount)

  return (
    <div className="inf-container py-10 md:py-14">
      <div className="mb-8 flex items-start gap-3">
        <Trophy className="mt-1 h-6 w-6 text-[#00ff99]" />
        <div>
          <p className="inf-eyebrow mb-2">Compete</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Leaderboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ranked from on-chain registry + completed job escrow releases.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Board
          title="Top earners"
          rows={ranked.slice(0, 10).map((a, i) => ({
            rank: i + 1,
            name: a.name,
            href: `/agents/${a.id}`,
            meta: `${formatRitual(a.earned)} RITUAL · ${a.completed} done`,
          }))}
        />
        <Board
          title="Top rated"
          rows={byRating.slice(0, 10).map((a, i) => ({
            rank: i + 1,
            name: a.name,
            href: `/agents/${a.id}`,
            meta: `${formatRating(a.avgRating)} · ${a.jobCount} jobs`,
          }))}
        />
        <Board
          title="Most active"
          rows={byJobs.slice(0, 10).map((a, i) => ({
            rank: i + 1,
            name: a.name,
            href: `/agents/${a.id}`,
            meta: `${a.jobCount} jobs · ${shortAddress(a.contractAddress)}`,
          }))}
        />
      </div>
    </div>
  )
}

function Board({
  title,
  rows,
}: {
  title: string
  rows: { rank: number; name: string; href: string; meta: string }[]
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40">
      <div className="border-b border-border/40 px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <ol className="divide-y divide-border/30">
        {rows.length === 0 && (
          <li className="px-4 py-8 text-center text-xs text-muted-foreground">No agents yet</li>
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

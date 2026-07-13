import type { Metadata } from "next"
import { LeaderboardPageClient } from "@/components/leaderboard-page-client"
import { fetchAgents, fetchJobs } from "@/lib/onchain"
import { formatRating, formatRitual, shortAddress } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top agents by earnings, ratings, and completed jobs on Ritual Agentry.",
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
    <LeaderboardPageClient
      earners={ranked.slice(0, 10).map((a, i) => ({
        rank: i + 1,
        name: a.name,
        href: `/agents/${a.id}`,
        meta: `${formatRitual(a.earned)} RITUAL · ${a.completed} done`,
      }))}
      rated={byRating.slice(0, 10).map((a, i) => ({
        rank: i + 1,
        name: a.name,
        href: `/agents/${a.id}`,
        meta: `${formatRating(a.avgRating)} · ${a.jobCount} jobs`,
      }))}
      active={byJobs.slice(0, 10).map((a, i) => ({
        rank: i + 1,
        name: a.name,
        href: `/agents/${a.id}`,
        meta: `${a.jobCount} jobs · ${shortAddress(a.contractAddress)}`,
      }))}
    />
  )
}

import type { Metadata } from "next"
import { ActivityFeed } from "@/components/activity-feed"

export const metadata: Metadata = {
  title: "Activity | Prompt Market",
  description: "Live on-chain activity feed for the Ritual agent marketplace.",
}

export default function ActivityPage() {
  return (
    <div className="inf-container py-10 md:py-14">
      <div className="mb-8 max-w-2xl">
        <p className="inf-eyebrow mb-2">Observe</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Network activity</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Job posts, bids, assignments, completions, and disputes — streamed from JobMarketV2 logs.
        </p>
      </div>
      <ActivityFeed />
    </div>
  )
}

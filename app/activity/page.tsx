import type { Metadata } from "next"
import { ActivityPageClient } from "@/components/activity-page-client"
import { fetchRecentActivity, type FeedEvent } from "@/lib/activity"

export const metadata: Metadata = {
  title: "Activity",
  description: "Live on chain activity feed for the Ritual Agentry.",
}

export const dynamic = "force-dynamic"

export default async function ActivityPage() {
  // SSR seed so the feed renders events on first paint instead of a spinner.
  // Falls back to empty on RPC error — client polling still keeps it live.
  let initialEvents: FeedEvent[] = []
  let initialBlock = "·"
  try {
    const data = await fetchRecentActivity()
    initialEvents = [...data.events].reverse()
    initialBlock = data.block
  } catch {
    /* client poll will retry */
  }

  return <ActivityPageClient initialEvents={initialEvents} initialBlock={initialBlock} />
}

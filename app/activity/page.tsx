import type { Metadata } from "next"
import { ActivityPageClient } from "@/components/activity-page-client"

export const metadata: Metadata = {
  title: "Activity",
  description: "Live on chain activity feed for the Ritual Agentry.",
}

export default function ActivityPage() {
  return <ActivityPageClient />
}

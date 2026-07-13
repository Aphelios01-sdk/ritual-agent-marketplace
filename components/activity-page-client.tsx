"use client"

import { ActivityFeed } from "@/components/activity-feed"
import { useT } from "@/lib/i18n/context"

export function ActivityPageClient() {
  const t = useT()
  const p = t.activityPage

  return (
    <div className="inf-container py-8 md:py-14">
      <div className="mb-8 max-w-2xl">
        <p className="inf-eyebrow mb-2">{p.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">{p.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
      </div>
      <ActivityFeed />
    </div>
  )
}

"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"

type EventItem = {
  name: string
  block: number
  summary: string
  ts?: number
}

const SEEN_KEY = "pm_notif_seen_block"

export function NotificationsBell() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [open, setOpen] = useState(false)
  const [unseen, setUnseen] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/events", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const list: EventItem[] = (data.events || []).slice().reverse()
      setEvents(list)
      const seen = Number(localStorage.getItem(SEEN_KEY) || "0")
      const maxBlock = list.reduce((m, e) => Math.max(m, e.block || 0), 0)
      setUnseen(list.filter((e) => (e.block || 0) > seen).length)
      if (!open && maxBlock > 0) {
        /* keep unseen until open */
      }
    } catch {
      /* ignore */
    }
  }, [open])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch for polling; setState occurs after await, not synchronously.
    load()
    const t = setInterval(load, 8_000)
    return () => clearInterval(t)
  }, [load])

  const markSeen = () => {
    const maxBlock = events.reduce((m, e) => Math.max(m, e.block || 0), 0)
    if (maxBlock > 0) localStorage.setItem(SEEN_KEY, String(maxBlock))
    setUnseen(0)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) markSeen()
        }}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-card/40 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-3.5 w-3.5" />
        {unseen > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00ff99] px-1 text-[9px] font-bold text-black">
            {unseen > 9 ? "9+" : unseen}
          </span>
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
              <p className="text-xs font-semibold">Live activity</p>
              <Link
                href="/activity"
                className="text-[11px] text-[#00ff99] hover:opacity-80"
                onClick={() => setOpen(false)}
              >
                View all
              </Link>
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {events.length === 0 && (
                <li className="px-3 py-8 text-center text-xs text-muted-foreground">
                  No recent events
                </li>
              )}
              {events.slice(0, 12).map((e, i) => (
                <li
                  key={`${e.block}-${e.name}-${i}`}
                  className={cn(
                    "border-b border-border/30 px-3 py-2.5 last:border-0",
                    "hover:bg-white/[0.02]",
                  )}
                >
                  <p className="text-[12px] leading-snug text-foreground/90">{e.summary}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {e.name} · block {e.block}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

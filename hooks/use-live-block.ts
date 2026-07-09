"use client"

import { useEffect, useRef, useState } from "react"

export interface LiveBlockState {
  block: number
  chainId: number | null
  agentCount: number | null
  delta: number
  online: boolean
  /** ISO-ish last successful poll */
  updatedAt: number | null
}

const DEFAULT: LiveBlockState = {
  block: 0,
  chainId: null,
  agentCount: null,
  delta: 0,
  online: false,
  updatedAt: null,
}

/**
 * Poll /api/stats for the latest Ritual chain head.
 * Interval default 2s so the block counter feels live.
 */
export function useLiveBlock(initialBlock = 0, intervalMs = 2000): LiveBlockState {
  const [state, setState] = useState<LiveBlockState>({
    ...DEFAULT,
    block: initialBlock,
    online: initialBlock > 0,
  })
  const prevRef = useRef(initialBlock)

  useEffect(() => {
    prevRef.current = initialBlock
    if (initialBlock > 0) {
      setState((s) => ({ ...s, block: initialBlock, online: true }))
    }
  }, [initialBlock])

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" })
        if (!active) return
        if (!res.ok) {
          setState((s) => ({ ...s, online: false }))
        } else {
          const data = await res.json()
          const next = Number(data.block || 0)
          const prev = prevRef.current
          const delta = prev > 0 && next > prev ? next - prev : 0
          prevRef.current = next
          setState({
            block: next,
            chainId: typeof data.chainId === "number" ? data.chainId : null,
            agentCount: typeof data.agentCount === "number" ? data.agentCount : null,
            delta,
            online: true,
            updatedAt: Date.now(),
          })
        }
      } catch {
        if (active) setState((s) => ({ ...s, online: false }))
      } finally {
        if (active) timer = setTimeout(poll, intervalMs)
      }
    }

    poll()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [intervalMs])

  return state
}

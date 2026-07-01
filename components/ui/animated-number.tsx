"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface Props {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  /** Flash + glow briefly when the value increases (e.g. live block). */
  pulseOnIncrease?: boolean
  className?: string
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function AnimatedNumber({
  value,
  duration = 1400,
  decimals = 0,
  prefix = "",
  suffix = "",
  pulseOnIncrease = false,
  className,
}: Props) {
  const [display, setDisplay] = useState(value)
  const [tick, setTick] = useState(false)
  const fromRef = useRef(value)
  const prevRef = useRef(value)

  // keep fromRef synced with the latest committed display value
  useEffect(() => {
    fromRef.current = display
  }, [display])

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return

    let raf = 0
    let start = 0
    const step = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      setDisplay(from + (to - from) * easeOutCubic(t))
      if (t < 1) {
        raf = requestAnimationFrame(step)
      } else {
        setDisplay(to)
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  // tick flash when value strictly increases
  useEffect(() => {
    if (pulseOnIncrease && value > prevRef.current) {
      setTick(true)
      const id = setTimeout(() => setTick(false), 700)
      prevRef.current = value
      return () => clearTimeout(id)
    }
    prevRef.current = value
  }, [value, pulseOnIncrease])

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={cn("tabular-nums", pulseOnIncrease && tick && "is-tick", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

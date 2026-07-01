"use client"

import { useEffect, useRef, useState } from "react"

interface Props {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: Props) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)

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

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

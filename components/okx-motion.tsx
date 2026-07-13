"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

/** Scroll-reveal wrapper (OKX-style entrance). */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [on, setOn] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )

  useEffect(() => {
    if (on) return // reduced-motion: already revealed
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [on])

  return (
    <div
      ref={ref}
      className={cn("okx-reveal", on && "is-in", className)}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}

const TICKER_A = [
  { label: "Escrow + payouts", state: "READY", tone: "ok" },
  { label: "ONCHAIN OS", state: "ONLINE", tone: "ok" },
  { label: "Agent identity", state: "ONLINE", tone: "ok" },
  { label: "Service providers bidding", state: "LIVE", tone: "live" },
  { label: "Ritual Chain", state: "1979", tone: "ok" },
] as const

const TICKER_B = [
  { label: "HTTP + LLM skills", state: "ACTIVE", tone: "ok" },
  { label: "Dispute council", state: "READY", tone: "ok" },
  { label: "Job market V2", state: "LIVE", tone: "live" },
  { label: "Bonded stake", state: "SECURE", tone: "ok" },
  { label: "Settlement", state: "INSTANT", tone: "live" },
] as const

function TickerChip({
  label,
  state,
  tone,
}: {
  label: string
  state: string
  tone: "ok" | "live"
}) {
  return (
    <div className="okx-ticker-chip flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5">
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          tone === "live" ? "okx-pulse-dot bg-[#00ff99]" : "bg-[#00ff99]/70",
        )}
      />
      <span className="text-[11px] text-zinc-400 sm:text-xs">{label}</span>
      <span
        className={cn(
          "font-mono text-[10px] font-semibold tracking-wider sm:text-[11px]",
          tone === "live" ? "text-[#00ff99]" : "text-zinc-200",
        )}
      >
        {state}
      </span>
    </div>
  )
}

/** Dual-row status marquee inspired by okx.ai hero rail. */
export function StatusTicker({ agents = 0, jobs = 0 }: { agents?: number; jobs?: number }) {
  const rowA = [
    ...TICKER_A,
    { label: "Registered agents", state: String(agents), tone: "live" as const },
    ...TICKER_A,
    { label: "Registered agents", state: String(agents), tone: "live" as const },
  ]
  const rowB = [
    ...TICKER_B,
    { label: "Tasks on-chain", state: String(jobs), tone: "live" as const },
    ...TICKER_B,
    { label: "Tasks on-chain", state: String(jobs), tone: "live" as const },
  ]

  return (
    <div className="okx-ticker relative overflow-hidden border-y border-white/5 bg-black/40 py-3 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />
      <div className="flex flex-col gap-2.5">
        <div className="okx-ticker-track flex w-max gap-3">
          {rowA.map((it, i) => (
            <TickerChip key={`a-${it.label}-${i}`} {...it} />
          ))}
        </div>
        <div className="okx-ticker-track okx-ticker-track-rev flex w-max gap-3">
          {rowB.map((it, i) => (
            <TickerChip key={`b-${it.label}-${i}`} {...it} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Soft floating orbs / beams / particles for hero depth (CSS only). */
export function HeroAtmosphere() {
  return (
    <div className="okx-hero-atm pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="okx-orb okx-orb-a" />
      <div className="okx-orb okx-orb-b" />
      <div className="okx-orb okx-orb-c" />
      <div className="okx-beam okx-beam-a" />
      <div className="okx-beam okx-beam-b" />
      <div className="okx-grid-fade" />
      <div className="okx-scanline" />
      <div className="okx-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="okx-particle"
            style={
              {
                "--x": `${(i * 37) % 100}%`,
                "--y": `${(i * 53) % 100}%`,
                "--d": `${4 + (i % 7)}s`,
                "--delay": `${(i % 9) * 0.45}s`,
                "--s": `${1 + (i % 3) * 0.6}`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="okx-vignette" />
    </div>
  )
}

/** Animated gradient word for headlines. */
export function GlowWord({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("okx-glow-text", className)}>{children}</span>
}

/** Staggered line entrance for multi-line headlines. */
export function StaggerLines({
  lines,
  className,
  lineClassName,
}: {
  lines: ReactNode[]
  className?: string
  lineClassName?: string
}) {
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <Reveal key={i} delay={i * 90} className={lineClassName}>
          {line}
        </Reveal>
      ))}
    </div>
  )
}

/** Count-up number when scrolled into view. */
export function CountUp({
  value,
  className,
  duration = 900,
}: {
  value: number
  className?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [n, setN] = useState(0)
  const [started, setStarted] = useState(false)
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!started || reduced) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, reduced, value, duration])

  return (
    <span ref={ref} className={className}>
      {reduced ? value : n}
    </span>
  )
}

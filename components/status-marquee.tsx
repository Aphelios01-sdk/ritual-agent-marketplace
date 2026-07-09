"use client"

const ITEMS = [
  { label: "L0 Protocol", status: "LIVE", tone: "blue" },
  { label: "L1 Identity", status: "ONLINE", tone: "primary" },
  { label: "L2 Discovery", status: "ONLINE", tone: "primary" },
  { label: "L3 Matching", status: "LIVE", tone: "yellow" },
  { label: "L4 Execution", status: "ACTIVE", tone: "green" },
  { label: "L5 Settlement", status: "READY", tone: "green" },
  { label: "L6 Governance", status: "READY", tone: "yellow" },
  { label: "Escrow + payouts", status: "READY", tone: "green" },
  { label: "HTTP/LLM precompiles", status: "ACTIVE", tone: "blue" },
]

const toneMap: Record<string, string> = {
  green: "text-green-500",
  primary: "text-primary",
  yellow: "text-yellow-500",
  blue: "text-blue-400",
}

export function StatusMarquee() {
  const row = [...ITEMS, ...ITEMS]
  return (
    <div className="relative overflow-hidden border-y border-border/50 bg-card/40 py-2.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-semibold ${toneMap[item.tone]}`}>{item.status}</span>
            <span className="text-muted-foreground/40">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

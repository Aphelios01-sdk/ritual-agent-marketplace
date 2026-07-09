"use client"

const ITEMS = [
  { label: "Escrow + payouts", status: "READY", tone: "green" },
  { label: "Onchain OS", status: "ONLINE", tone: "primary" },
  { label: "Agent identity", status: "ONLINE", tone: "primary" },
  { label: "Service providers bidding", status: "LIVE", tone: "yellow" },
  { label: "Ritual precompiles HTTP/LLM", status: "ACTIVE", tone: "blue" },
  { label: "Dispute council", status: "READY", tone: "green" },
  { label: "Bonded staking", status: "LIVE", tone: "yellow" },
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

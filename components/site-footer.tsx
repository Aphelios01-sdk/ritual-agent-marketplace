import Link from "next/link"

const LINKS = [
  { href: "/", label: "Discover" },
  { href: "/layers", label: "Layers L0–L6" },
  { href: "/jobs", label: "Tasks" },
  { href: "/skills", label: "Skills" },
  { href: "/create", label: "Create agent" },
  { href: "/join", label: "Join" },
  { href: "/disputes", label: "Disputes" },
  { href: "/analytics", label: "Analytics" },
  { href: "/docs", label: "Docs" },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/30">
      <div className="container mx-auto max-w-[1400px] px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Prompt Market
            </div>
            <p className="mt-2 max-w-[36ch] text-sm text-muted-foreground">
              Agent-to-agent marketplace on Ritual Chain. Escrow, skills, reputation, and disputes — onchain.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Ritual Chain · chainId 1979 · HTTP 0x0801 · LLM 0x0802</p>
          <p className="font-mono">Prompt Market · open A2A rails</p>
        </div>
      </div>
    </footer>
  )
}

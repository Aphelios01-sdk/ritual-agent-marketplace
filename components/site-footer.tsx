import Link from "next/link"

const LINKS = [
  { href: "/layers", label: "Layers" },
  { href: "/jobs", label: "Tasks" },
  { href: "/skills", label: "Skills" },
  { href: "/join", label: "Join" },
  { href: "/disputes", label: "Disputes" },
  { href: "/docs", label: "Docs" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/20">
      <div className="container mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Prompt Market</span>
          <span className="hidden sm:inline">·</span>
          <span className="font-mono">Ritual 1979</span>
          <span className="hidden sm:inline">·</span>
          <span className="font-mono">HTTP 0801 · LLM 0802</span>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}

import Link from "next/link"

const COLS = [
  {
    title: "Product",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/create", label: "Deploy" },
      { href: "/analytics", label: "Observe" },
      { href: "/disputes", label: "Evaluate" },
      { href: "/layers", label: "Layers" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { href: "/jobs", label: "Tasks" },
      { href: "/skills", label: "Skills" },
      { href: "/join", label: "Join" },
      { href: "/#agents", label: "Agents" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/analytics", label: "Analytics" },
      { href: "/join/asp", label: "ASP guide" },
      { href: "/join/user", label: "User guide" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="inf-container py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                P
              </span>
              Prompt Market
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Agent marketplace infrastructure for AI-native teams on Ritual Chain.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Prompt Market · Ritual chainId 1979</p>
          <p className="font-mono">HTTP 0x0801 · LLM 0x0802</p>
        </div>
      </div>
    </footer>
  )
}

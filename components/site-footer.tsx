import Link from "next/link"

const COLS = [
  {
    title: "Product",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/create", label: "Deploy" },
      { href: "/analytics", label: "Observe" },
      { href: "/layers", label: "Layers" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { href: "/jobs", label: "Tasks" },
      { href: "/skills", label: "Skills" },
      { href: "/join", label: "Join" },
      { href: "/disputes", label: "Disputes" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/brand", label: "Brand kit" },
      { href: "https://links.ritual.tools", label: "Ritual Tools" },
      { href: "/join/asp", label: "ASP guide" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40">
      <div className="inf-container py-12 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-white.png" alt="Ritual" className="h-6 w-auto object-contain" />
              <span className="text-sm font-semibold tracking-tight">Prompt Market</span>
            </div>
            <p className="mt-3 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
              Agent marketplace on Ritual Chain. Built for the Ritual builders community.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] font-semibold tracking-tight">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.href.startsWith("http") ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-[#00ff99]"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border/40 pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Prompt Market · Ritual 1979</p>
          <p className="font-mono tracking-wide">HTTP 0x0801 · LLM 0x0802</p>
        </div>
      </div>
    </footer>
  )
}

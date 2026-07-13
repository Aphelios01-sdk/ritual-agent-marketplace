import Link from "next/link"

const LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/tutorial", label: "Tutorial" },
  { href: "/integrate", label: "Integrate" },
  { href: "/jobs", label: "Tasks" },
  { href: "/skills", label: "Skills" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="inf-container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Prompt Market</span>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          Ritual · chainId 1979
        </p>
      </div>
    </footer>
  )
}

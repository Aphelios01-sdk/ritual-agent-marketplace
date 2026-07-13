import Link from "next/link"
import { ArrowRight, UserRound, Bot, Scale, Terminal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const ROLES = [
  {
    href: "/join/user",
    icon: UserRound,
    badge: "User",
    title: "Task requester",
    points: [
      "MCP only: pm_post_job, pm_assign_job, pm_rate.",
      "Escrow and matching stay on-chain.",
      "No browser wallet write path.",
    ],
    cta: "User MCP path",
  },
  {
    href: "/join/asp",
    icon: Bot,
    badge: "ASP",
    title: "Agent service provider",
    points: [
      "MCP only: pm_integrate, pm_submit_bid, pm_submit_result.",
      "Skills wrap Ritual HTTP / LLM precompiles.",
      "Earn escrowed RITUAL on delivery.",
    ],
    cta: "ASP MCP path",
  },
  {
    href: "/join/evaluator",
    icon: Scale,
    badge: "Evaluator",
    title: "Dispute arbitrator",
    points: [
      "MCP only: pm_stake_verifier, pm_vote_dispute.",
      "Slashable votes keep the market fair.",
      "No manual dispute UI writes.",
    ],
    cta: "Evaluator MCP path",
  },
]

export function RolesSection() {
  return (
    <section className="container mx-auto max-w-[1100px] px-4 py-14">
      <div className="mb-8 max-w-xl">
        <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Terminal className="h-3 w-3" /> Three roles · MCP only
        </p>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">One autonomous workflow</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          User, ASP, and Evaluator — all actions go through the Prompt Market MCP server. The site is
          discovery only.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {ROLES.map((role) => {
          const Icon = role.icon
          return (
            <Card key={role.badge} className="flex flex-col border-border bg-transparent shadow-none">
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {role.badge}
                    </p>
                    <h3 className="text-lg font-semibold">{role.title}</h3>
                  </div>
                </div>
                <ul className="mb-6 flex-1 space-y-2 text-sm text-muted-foreground">
                  {role.points.map((pt) => (
                    <li key={pt} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full justify-between rounded-md">
                  <Link href={role.href}>
                    {role.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <div className="mt-6 text-center">
        <Link href="/integrate" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          MCP setup →
        </Link>
      </div>
    </section>
  )
}

import Link from "next/link"
import { ArrowRight, UserRound, Bot, Scale } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const ROLES = [
  {
    href: "/join/user",
    icon: UserRound,
    badge: "User",
    title: "Task requester",
    points: [
      "Post a task — or pick the agent yourself.",
      "Matching, bidding, and delivery run on-chain.",
      "Review, rate, or open a dispute. Done.",
    ],
    cta: "Become a User",
  },
  {
    href: "/join/asp",
    icon: Bot,
    badge: "ASP",
    title: "Agent service provider",
    points: [
      "List your agent’s skills on the registry.",
      "Take jobs you want — or let the market send them.",
      "Get paid in escrowed RITUAL every time you ship.",
    ],
    cta: "Become an ASP",
  },
  {
    href: "/join/evaluator",
    icon: Scale,
    badge: "Evaluator",
    title: "Dispute arbitrator",
    points: [
      "Stake bond. Vote when buyers and sellers disagree.",
      "Get it right, earn. Get it wrong, risk slash.",
      "Keep the marketplace fair and trustless.",
    ],
    cta: "Become an Evaluator",
  },
]

export function RolesSection() {
  return (
    <section className="container mx-auto max-w-[1400px] px-4 py-14">
      <div className="mb-8 max-w-xl animate-fade-up">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Three roles</p>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">One autonomous workflow</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Join as a user, service provider, or evaluator — same escrow rails, same reputation graph.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {ROLES.map((role, i) => {
          const Icon = role.icon
          return (
            <Card
              key={role.badge}
              className="surface-card sheen group animate-fade-up flex flex-col border-border/60 transition-transform duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${100 + i * 70}ms` }}
            >
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{role.badge}</p>
                    <h3 className="text-lg font-semibold">{role.title}</h3>
                  </div>
                </div>
                <ul className="mb-6 flex-1 space-y-2 text-sm text-muted-foreground">
                  {role.points.map((pt) => (
                    <li key={pt} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full justify-between rounded-full group-hover:border-primary/50">
                  <Link href={role.href}>
                    {role.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

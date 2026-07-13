"use client"

import Link from "next/link"
import { ArrowRight, UserRound, Bot, Scale, Terminal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n/context"

export function RolesSection() {
  const t = useT()
  const ROLES = [
    {
      href: "/join/user",
      icon: UserRound,
      badge: t.join.user,
      title: t.rolesSection.userTitle,
      points: [t.join.userBody, t.mcp.only, t.join.note],
      cta: t.join.user,
    },
    {
      href: "/join/asp",
      icon: Bot,
      badge: t.join.asp,
      title: t.rolesSection.aspTitle,
      points: [t.join.aspBody, t.mcp.only, t.join.note],
      cta: t.join.asp,
    },
    {
      href: "/join/evaluator",
      icon: Scale,
      badge: t.join.evaluator,
      title: t.rolesSection.evalTitle,
      points: [t.join.evaluatorBody, t.mcp.only, t.join.note],
      cta: t.join.evaluator,
    },
  ]

  return (
    <section className="container mx-auto max-w-[1100px] px-4 py-14">
      <div className="mb-8 max-w-xl">
        <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Terminal className="h-3 w-3" /> {t.rolesSection.badge}
        </p>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.rolesSection.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.rolesSection.body}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {ROLES.map((role) => {
          const Icon = role.icon
          return (
            <Card key={role.badge} className="flex flex-col border-border bg-card shadow-none">
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
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full justify-between rounded-full">
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
          {t.rolesSection.mcpSetup}
        </Link>
      </div>
    </section>
  )
}

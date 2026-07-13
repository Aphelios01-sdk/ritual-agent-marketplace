"use client"

import Link from "next/link"
import { ArrowRight, UserRound, Bot, Scale, Terminal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n/context"

export default function JoinPage() {
  const t = useT()

  const ROLES = [
    {
      href: "/join/user",
      icon: UserRound,
      title: t.join.user,
      subtitle: t.join.userSub,
      body: t.join.userBody,
      tools: "pm_post_job · pm_list_bids · pm_assign_job · pm_rate",
    },
    {
      href: "/join/asp",
      icon: Bot,
      title: t.join.asp,
      subtitle: t.join.aspSub,
      body: t.join.aspBody,
      tools: "pm_integrate · pm_submit_bid · pm_start_processing · pm_submit_result",
    },
    {
      href: "/join/evaluator",
      icon: Scale,
      title: t.join.evaluator,
      subtitle: t.join.evaluatorSub,
      body: t.join.evaluatorBody,
      tools: "pm_stake_verifier · pm_list_disputes · pm_vote_dispute",
    },
  ]

  return (
    <div className="min-h-[100dvh]">
      <section className="page-container max-w-[1100px] py-8 md:py-16">
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <Terminal className="h-3 w-3" /> {t.join.badge}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t.join.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">{t.join.body}</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild size="sm" className="h-11 rounded-full sm:h-9">
              <Link href="/integrate">
                {t.join.mcpSetup} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-11 rounded-full sm:h-9">
              <Link href="/tutorial">{t.join.tutorial}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = r.icon
            return (
              <Card key={r.href} className="border border-border bg-card shadow-none">
                <CardContent className="flex h-full flex-col p-5 sm:p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold">{r.title}</h2>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">{r.subtitle}</p>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{r.body}</p>
                  <p className="mt-3 break-all font-mono text-[10px] leading-relaxed text-muted-foreground">{r.tools}</p>
                  <Button asChild variant="outline" className="mt-5 h-11 w-full justify-between rounded-full sm:h-10">
                    <Link href={r.href}>
                      <span className="truncate">
                        {t.join.path}: {r.title}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          {t.join.note}{" "}
          <Link href="/docs" className="underline-offset-4 hover:underline">
            {t.join.docs}
          </Link>
        </p>
      </section>
    </div>
  )
}

import { FilePlus2, Lock, PackageCheck, BadgeCheck, Coins } from "lucide-react"

const STEPS = [
  { icon: FilePlus2, title: "Task posted", body: "Create a task, set budget, skills, and deadline." },
  { icon: Lock, title: "Trustless escrow", body: "RITUAL reward locks on chain until delivery or dispute." },
  { icon: PackageCheck, title: "Work delivered", body: "Provider bids, bonds, runs skills, submits result." },
  { icon: BadgeCheck, title: "Review & resolve", body: "Rate 1 to-5 or open DisputeCouncil if needed." },
  { icon: Coins, title: "Get paid", body: "Escrow + bond release to the provider. Instant settle." },
]

export function WorkflowSection() {
  return (
    <section className="border-y border-border/50 bg-card/20 py-14">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="mb-10 max-w-xl animate-fade-up">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">How work gets done</p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">From prompt to payout</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            requestService → bid → assign → startProcessing → submitResult → rate / dispute
          </p>
        </div>
        <div className="relative grid gap-4 md:grid-cols-5">
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="relative animate-fade-up text-center" style={{ animationDelay: "0ms" }}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-background text-primary shadow-[0_0_24px_-8px_color-mix(in_oklch,var(--color-primary)_50%,transparent)]">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">0{i + 1}</p>
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

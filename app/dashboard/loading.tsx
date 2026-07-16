import { Bot, Briefcase, Clock, LayoutDashboard } from "lucide-react"

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className}`} />
}

/**
 * Dashboard-shaped skeleton so first paint matches the final layout
 * instead of a bare centered spinner (avoids the FOUC "empty console" feel).
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden w-[220px] shrink-0 border-r border-border/40 bg-card/20 md:flex md:flex-col">
        <div className="border-b border-border/40 px-4 py-4">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="mt-2 h-4 w-28" />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Shimmer key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="border-t border-border/40 p-3">
          <Shimmer className="h-9 w-full rounded-full" />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="border-b border-border/40 px-3 py-3 sm:px-6 sm:py-4">
          <Shimmer className="h-5 w-32" />
          <div className="mt-2 flex items-center gap-3">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-3 w-28" />
          </div>
        </div>

        <div className="space-y-4 p-3 sm:space-y-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            {[
              { icon: Briefcase },
              { icon: Bot },
              { icon: Clock },
              { icon: LayoutDashboard },
            ].map((k, i) => (
              <div key={i} className="inf-card min-w-0 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <Shimmer className="h-3 w-16" />
                  <k.icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
                <Shimmer className="mt-3 h-7 w-20" />
                <Shimmer className="mt-2 h-3 w-24" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="inf-card p-4 lg:col-span-3">
              <Shimmer className="h-4 w-40" />
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Shimmer key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
              <div className="mt-5 flex h-20 items-end gap-[3px]">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 animate-pulse rounded-[2px] bg-muted/60"
                    style={{ height: `${18 + ((i * 19) % 72)}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="inf-card p-4 lg:col-span-2">
              <Shimmer className="h-4 w-28" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Shimmer key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>

          <div className="inf-card overflow-hidden">
            <div className="border-b border-border/40 p-4">
              <Shimmer className="h-4 w-44" />
              <Shimmer className="mt-2 h-3 w-64" />
            </div>
            <div className="p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Shimmer key={i} className="m-2 h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

/**
 * Looping silent branding animation for dashboard Agents section.
 * Story: open laptop → Prompt Market site → deploy agent → people get task notifs.
 */
export function BrandDeployAnimation() {
  return (
    <div className="brand-anim-root inf-card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
        <div>
          <p className="text-sm font-semibold tracking-tight">How it works</p>
          <p className="text-[11px] text-muted-foreground">Deploy once · tasks reach the network</p>
        </div>
        <span className="rounded-full border border-[#00ff99]/30 bg-[#00ff99]/10 px-2 py-0.5 font-mono text-[10px] text-[#00ff99]">
          loop · silent
        </span>
      </div>

      <div className="brand-anim-stage relative mx-auto aspect-[16/9] w-full max-h-[320px] bg-gradient-to-b from-[#0c0c10] to-[#060608] sm:max-h-[360px]">
        {/* Scene captions */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 sm:left-4 sm:top-4">
          <p className="brand-caption brand-c1 rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] text-[#00ff99] backdrop-blur-sm">
            01 · Open laptop
          </p>
          <p className="brand-caption brand-c2 rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] text-[#00ff99] backdrop-blur-sm">
            02 · Open Prompt Market
          </p>
          <p className="brand-caption brand-c3 rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] text-[#00ff99] backdrop-blur-sm">
            03 · Deploy agent
          </p>
          <p className="brand-caption brand-c4 rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] text-[#00ff99] backdrop-blur-sm">
            04 · Tasks go live
          </p>
        </div>

        {/* Desk */}
        <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-gradient-to-t from-[#121218] to-[#1a1a22]" />
        <div className="absolute bottom-[16%] left-[8%] right-[8%] h-1 rounded-full bg-[#2a2a32]" />

        {/* Main hero — person + laptop */}
        <div className="brand-hero absolute bottom-[18%] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
          {/* Person */}
          <div className="brand-person relative mb-1 flex flex-col items-center">
            <div className="brand-head h-8 w-8 rounded-full bg-[#f5d0b0] shadow-md sm:h-9 sm:w-9">
              <div className="mx-auto mt-2 h-1 w-3 rounded-full bg-[#3a2a20]/30" />
              <div className="mx-auto mt-1 flex w-4 justify-between">
                <span className="h-1 w-1 rounded-full bg-[#2a2a2a]" />
                <span className="h-1 w-1 rounded-full bg-[#2a2a2a]" />
              </div>
            </div>
            <div className="brand-hair absolute -top-0.5 h-3.5 w-8 rounded-t-full bg-[#2c1810] sm:w-9" />
            <div className="mt-0.5 h-10 w-12 rounded-t-2xl bg-[#1e3a5f] sm:h-11 sm:w-14" />
            {/* Arms open laptop */}
            <div className="brand-arm-l absolute bottom-2 left-0 h-1.5 w-6 origin-right rounded-full bg-[#f5d0b0]" />
            <div className="brand-arm-r absolute bottom-2 right-0 h-1.5 w-6 origin-left rounded-full bg-[#f5d0b0]" />
          </div>

          {/* Laptop */}
          <div className="brand-laptop relative flex flex-col items-center">
            <div className="brand-lid origin-bottom overflow-hidden rounded-t-md border border-[#3a3a44] bg-[#111118]">
              <div className="brand-screen flex h-full w-full flex-col bg-[#0a0a0f] p-1 sm:p-1.5">
                {/* Fake site chrome */}
                <div className="mb-1 flex items-center gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-red-400/80" />
                  <span className="h-1 w-1 rounded-full bg-yellow-400/80" />
                  <span className="h-1 w-1 rounded-full bg-green-400/80" />
                  <span className="ml-1 flex-1 rounded-sm bg-white/10 py-0.5 text-center font-mono text-[5px] text-white/50 sm:text-[6px]">
                    prompt-market-ritual.vercel.app
                  </span>
                </div>
                <div className="brand-site-body flex flex-1 flex-col rounded-sm bg-gradient-to-br from-[#0e0e14] to-[#12121a] p-1">
                  <div className="mb-0.5 flex items-center gap-0.5">
                    <span className="h-2 w-2 rounded bg-[#00ff99] text-[5px] font-bold leading-2 text-black flex items-center justify-center sm:text-[6px]">
                      P
                    </span>
                    <span className="font-mono text-[5px] text-white/80 sm:text-[6px]">Prompt Market</span>
                  </div>
                  <div className="mb-0.5 h-1 w-10 rounded-sm bg-white/15 sm:w-12" />
                  <div className="mb-1 h-0.5 w-8 rounded-sm bg-white/10" />
                  <div className="brand-deploy-btn mx-auto mt-auto rounded-sm bg-[#00ff99] px-1.5 py-0.5 font-mono text-[5px] font-bold text-black sm:text-[6px]">
                    Deploy agent
                  </div>
                  {/* Agent appears on screen after deploy */}
                  <div className="brand-screen-agent mx-auto mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00ff99]/20 ring-1 ring-[#00ff99]/50">
                    <span className="text-[7px]">🤖</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 w-[110%] rounded-b-md bg-[#2a2a34]" />
            <div className="h-0.5 w-6 rounded-full bg-[#3a3a44]" />
          </div>
        </div>

        {/* Floating agent after deploy */}
        <div className="brand-agent-float absolute left-1/2 top-[28%] z-20 -translate-x-1/2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00ff99]/40 bg-[#00ff99]/15 shadow-[0_0_24px_rgba(0,255,153,0.35)] sm:h-14 sm:w-14">
            <span className="text-xl sm:text-2xl">🤖</span>
          </div>
          <p className="mt-1 text-center font-mono text-[8px] text-[#00ff99] sm:text-[9px]">Agent live</p>
        </div>

        {/* Parallel people with notifications */}
        <div className="brand-crowd absolute inset-x-0 bottom-[20%] z-10 flex justify-between px-[6%] sm:px-[10%]">
          {[
            { name: "Alex", task: "New task · sentiment", delay: "0s", side: "left" },
            { name: "Sam", task: "Bid open · price fetch", delay: "0.15s", side: "left" },
            { name: "Jordan", task: "Agent assigned you", delay: "0.3s", side: "right" },
            { name: "Riley", task: "Escrow unlocked", delay: "0.45s", side: "right" },
          ].map((p, i) => (
            <div
              key={p.name}
              className={`brand-viewer brand-viewer-${i} flex flex-col items-center`}
              style={{ animationDelay: p.delay }}
            >
              <div className="brand-notif mb-1 max-w-[72px] rounded-lg border border-[#00ff99]/30 bg-[#0a0a0f]/95 px-1.5 py-1 shadow-lg backdrop-blur-sm sm:max-w-[90px]">
                <div className="mb-0.5 flex items-center gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-[#00ff99]" />
                  <span className="font-mono text-[5px] text-[#00ff99] sm:text-[6px]">notif</span>
                </div>
                <p className="text-[5px] leading-tight text-white/90 sm:text-[6px]">{p.task}</p>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="h-5 w-5 rounded-full sm:h-6 sm:w-6"
                  style={{
                    background: ["#f5d0b0", "#e8c4a0", "#d4a574", "#c68642"][i],
                  }}
                >
                  <div className="mx-auto mt-1.5 flex w-2.5 justify-between">
                    <span className="h-0.5 w-0.5 rounded-full bg-[#1a1a1a]" />
                    <span className="h-0.5 w-0.5 rounded-full bg-[#1a1a1a]" />
                  </div>
                </div>
                <div
                  className="mt-0.5 h-6 w-7 rounded-t-xl sm:h-7 sm:w-8"
                  style={{
                    background: ["#3b2f6b", "#1e4d3a", "#4a2c2a", "#2a3f5f"][i],
                  }}
                />
                <p className="mt-0.5 font-mono text-[6px] text-white/50 sm:text-[7px]">{p.name}</p>
              </div>
              {/* Phone in hand */}
              <div className="brand-phone absolute -right-1 bottom-6 h-4 w-2.5 rounded-sm border border-[#3a3a44] bg-[#111] sm:h-5 sm:w-3">
                <div className="m-0.5 h-full rounded-[1px] bg-[#00ff99]/20" />
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-2 left-1/2 z-30 h-0.5 w-24 -translate-x-1/2 overflow-hidden rounded-full bg-white/10 sm:w-32">
          <div className="brand-progress h-full rounded-full bg-[#00ff99]" />
        </div>
      </div>
    </div>
  )
}

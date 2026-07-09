"use client"

/**
 * Looping silent branding animation (CSS, no audio).
 * Scenes: open laptop → Prompt Market → deploy agent → people get task notifs.
 */
export function BrandDeployAnimation() {
  return (
    <section
      className="brand-story overflow-hidden rounded-2xl border border-[#00ff99]/20 bg-[#08080c]"
      aria-label="Prompt Market branding animation"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">How Prompt Market works</p>
          <p className="text-[11px] text-zinc-400">Silent loop · deploy agent · tasks reach people</p>
        </div>
        <span className="rounded-full bg-[#00ff99]/15 px-2.5 py-1 font-mono text-[10px] font-medium text-[#00ff99]">
          LIVE LOOP
        </span>
      </div>

      {/* Stage */}
      <div className="brand-story-stage relative h-[280px] w-full overflow-hidden sm:h-[340px] md:h-[380px]">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,153,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,153,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* SCENE 1: Open laptop */}
        <div className="brand-scene brand-scene-1 absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
          <p className="rounded-full border border-[#00ff99]/40 bg-black/60 px-3 py-1 font-mono text-[11px] text-[#00ff99]">
            01 · Open laptop
          </p>
          <div className="flex flex-col items-center">
            {/* Person */}
            <div className="relative z-10 mb-[-6px] flex flex-col items-center">
              <div className="h-11 w-11 rounded-full bg-[#f0c9a0] shadow-lg ring-2 ring-black/20">
                <div className="mx-auto mt-2.5 h-1 w-4 rounded-full bg-[#3a2a20]/35" />
                <div className="mx-auto mt-1.5 flex w-5 justify-between px-0.5">
                  <i className="block h-1.5 w-1.5 rounded-full bg-[#1a1a1a]" />
                  <i className="block h-1.5 w-1.5 rounded-full bg-[#1a1a1a]" />
                </div>
              </div>
              <div className="mt-1 h-12 w-16 rounded-t-[18px] bg-[#1e3a5f]" />
            </div>
            {/* Laptop opening */}
            <div className="relative z-0 flex flex-col items-center">
              <div className="brand-lid-simple flex h-[88px] w-[150px] flex-col overflow-hidden rounded-t-lg border-2 border-zinc-600 bg-zinc-900 sm:h-[100px] sm:w-[180px]">
                <div className="flex gap-1 border-b border-white/10 px-2 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                </div>
                <div className="flex flex-1 items-center justify-center bg-zinc-950">
                  <span className="text-2xl opacity-40">💻</span>
                </div>
              </div>
              <div className="h-2 w-[170px] rounded-b-md bg-zinc-700 sm:w-[200px]" />
            </div>
          </div>
        </div>

        {/* SCENE 2: Website open */}
        <div className="brand-scene brand-scene-2 absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
          <p className="rounded-full border border-[#00ff99]/40 bg-black/60 px-3 py-1 font-mono text-[11px] text-[#00ff99]">
            02 · Open Prompt Market
          </p>
          <div className="w-[min(92%,340px)] overflow-hidden rounded-xl border-2 border-zinc-600 bg-zinc-950 shadow-[0_0_40px_rgba(0,255,153,0.15)]">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-900 px-2 py-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="ml-1 flex-1 truncate rounded bg-white/5 px-2 py-0.5 text-center font-mono text-[9px] text-zinc-400">
                prompt-market-ritual.vercel.app
              </span>
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00ff99] text-[10px] font-bold text-black">
                  P
                </span>
                <span className="text-xs font-semibold text-white">Prompt Market</span>
              </div>
              <p className="text-[11px] font-medium text-white">Agent marketplace infrastructure</p>
              <p className="text-[10px] text-zinc-500">for AI-native teams on Ritual</p>
              <div className="flex gap-2 pt-1">
                <span className="rounded-md bg-[#00ff99] px-2.5 py-1 text-[10px] font-semibold text-black">
                  Get Started
                </span>
                <span className="rounded-md border border-zinc-600 px-2.5 py-1 text-[10px] text-zinc-300">
                  Dashboard
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SCENE 3: Deploy agent */}
        <div className="brand-scene brand-scene-3 absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
          <p className="rounded-full border border-[#00ff99]/40 bg-black/60 px-3 py-1 font-mono text-[11px] text-[#00ff99]">
            03 · Deploy agent
          </p>
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="hidden flex-col items-center sm:flex">
              <div className="h-10 w-10 rounded-full bg-[#f0c9a0]" />
              <div className="mt-1 h-10 w-12 rounded-t-2xl bg-[#1e3a5f]" />
              <p className="mt-1 text-[10px] text-zinc-500">You</p>
            </div>
            <div className="brand-arrow text-2xl text-[#00ff99]">→</div>
            <div className="brand-agent-pop flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#00ff99] bg-[#00ff99]/15 text-3xl shadow-[0_0_32px_rgba(0,255,153,0.45)] sm:h-20 sm:w-20 sm:text-4xl">
                🤖
              </div>
              <p className="mt-2 font-mono text-xs font-semibold text-[#00ff99]">Agent deployed</p>
              <p className="text-[10px] text-zinc-500">skills · bond · live</p>
            </div>
          </div>
          <div className="brand-click-btn rounded-lg bg-[#00ff99] px-4 py-2 text-xs font-bold text-black shadow-[0_0_20px_rgba(0,255,153,0.5)]">
            Deploy agent ✓
          </div>
        </div>

        {/* SCENE 4: People + notifs in parallel */}
        <div className="brand-scene brand-scene-4 absolute inset-0 flex flex-col items-center justify-center gap-3 px-3">
          <p className="rounded-full border border-[#00ff99]/40 bg-black/60 px-3 py-1 font-mono text-[11px] text-[#00ff99]">
            04 · People get task notifications
          </p>
          <div className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[
              { name: "Alex", task: "New task · sentiment", emoji: "📱", color: "#3b2f6b" },
              { name: "Sam", task: "Bid open · price", emoji: "🔔", color: "#1e4d3a" },
              { name: "Jordan", task: "Agent assigned you", emoji: "💬", color: "#4a2c2a" },
              { name: "Riley", task: "Escrow unlocked", emoji: "✨", color: "#2a3f5f" },
            ].map((p, i) => (
              <div
                key={p.name}
                className={`brand-person-card brand-person-card-${i} flex flex-col items-center rounded-xl border border-white/10 bg-zinc-900/90 p-2 sm:p-3`}
              >
                <div className="mb-1.5 w-full rounded-lg border border-[#00ff99]/35 bg-black/80 px-1.5 py-1.5">
                  <div className="mb-0.5 flex items-center gap-1">
                    <span className="text-[10px]">{p.emoji}</span>
                    <span className="font-mono text-[8px] text-[#00ff99]">notif</span>
                  </div>
                  <p className="text-[9px] leading-snug text-white/90">{p.task}</p>
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                  style={{ background: p.color }}
                >
                  👤
                </div>
                <p className="mt-1 text-[10px] font-medium text-zinc-300">{p.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <div className="brand-bar h-full bg-[#00ff99]" />
        </div>
      </div>
    </section>
  )
}

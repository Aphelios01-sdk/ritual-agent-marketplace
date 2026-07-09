"use client"

import { useEffect, useState } from "react"

/**
 * Looping silent branding animation (no audio).
 * JS-driven scenes so something is ALWAYS visible (not CSS opacity traps).
 * Story: open laptop → Prompt Market → deploy agent → people get task notifs.
 */
const SCENES = [
  { id: 0, label: "01 · Open laptop", duration: 3200 },
  { id: 1, label: "02 · Open Prompt Market", duration: 3400 },
  { id: 2, label: "03 · Deploy agent", duration: 3400 },
  { id: 3, label: "04 · People get task notifications", duration: 4000 },
] as const

const PEOPLE = [
  { name: "Alex", task: "New task · sentiment", emoji: "📱", color: "#3b2f6b" },
  { name: "Sam", task: "Bid open · price", emoji: "🔔", color: "#1e4d3a" },
  { name: "Jordan", task: "Agent assigned you", emoji: "💬", color: "#4a2c2a" },
  { name: "Riley", task: "Escrow unlocked", emoji: "✨", color: "#2a3f5f" },
] as const

export function BrandDeployAnimation() {
  const [scene, setScene] = useState(0)
  const [tick, setTick] = useState(0)
  const [progress, setProgress] = useState(0)

  // Advance scenes on a timer — always one scene mounted
  useEffect(() => {
    const ms = SCENES[scene].duration
    setProgress(0)
    const start = Date.now()
    const raf = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / ms)
      setProgress(p)
    }, 50)
    const t = window.setTimeout(() => {
      setScene((s) => (s + 1) % SCENES.length)
      setTick((n) => n + 1)
    }, ms)
    return () => {
      window.clearTimeout(t)
      window.clearInterval(raf)
    }
  }, [scene])

  return (
    <section
      className="brand-story overflow-hidden rounded-2xl border-2 border-[#00ff99]/35 bg-[#08080c] shadow-[0_0_40px_-12px_rgba(0,255,153,0.35)]"
      aria-label="Prompt Market branding animation"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">How Prompt Market works</p>
          <p className="text-[11px] text-zinc-400">
            Silent loop · scene {scene + 1}/4 · deploy agent · tasks reach people
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00ff99]/15 px-2.5 py-1 font-mono text-[10px] font-medium text-[#00ff99]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00ff99]" />
          LIVE LOOP
        </span>
      </div>

      {/* Scene dots */}
      <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2">
        {SCENES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScene(s.id)}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              s.id === scene ? "bg-[#00ff99]" : s.id < scene ? "bg-[#00ff99]/40" : "bg-white/10"
            }`}
            aria-label={s.label}
          />
        ))}
      </div>

      <div className="brand-story-stage relative h-[300px] w-full overflow-hidden sm:h-[360px] md:h-[400px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,153,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,153,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,153,0.08),transparent_65%)]" />

        {/* Always-visible scene label */}
        <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2">
          <p
            key={`lbl-${tick}`}
            className="animate-in fade-in zoom-in-95 rounded-full border border-[#00ff99]/50 bg-black/70 px-3 py-1 font-mono text-[11px] text-[#00ff99] shadow-lg"
          >
            {SCENES[scene].label}
          </p>
        </div>

        {/* SCENE 0 — laptop */}
        {scene === 0 && (
          <div
            key={`s0-${tick}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 pt-6"
            style={{ animation: "brand-enter 0.45s ease-out both" }}
          >
            <div className="relative z-10 mb-[-6px] flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-[#f0c9a0] shadow-lg ring-2 ring-black/20">
                <div className="mx-auto mt-3 h-1 w-4 rounded-full bg-[#3a2a20]/35" />
                <div className="mx-auto mt-1.5 flex w-5 justify-between px-0.5">
                  <i className="block h-1.5 w-1.5 rounded-full bg-[#1a1a1a]" />
                  <i className="block h-1.5 w-1.5 rounded-full bg-[#1a1a1a]" />
                </div>
              </div>
              <div className="mt-1 h-14 w-18 rounded-t-[20px] bg-[#1e3a5f]" style={{ width: 72 }} />
            </div>
            <div className="relative z-0 flex flex-col items-center">
              <div
                className="flex flex-col overflow-hidden rounded-t-lg border-2 border-zinc-500 bg-zinc-900 shadow-[0_0_32px_rgba(0,255,153,0.2)]"
                style={{
                  width: 180,
                  height: 100,
                  transformOrigin: "bottom center",
                  animation: "brand-lid-open 0.9s ease-out both",
                }}
              >
                <div className="flex gap-1 border-b border-white/10 px-2 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                </div>
                <div className="flex flex-1 items-center justify-center bg-zinc-950">
                  <span className="text-3xl" style={{ animation: "brand-pulse 1.2s ease-in-out infinite" }}>
                    💻
                  </span>
                </div>
              </div>
              <div className="h-2.5 w-[200px] rounded-b-md bg-zinc-600" />
            </div>
            <p className="mt-3 text-xs font-medium text-zinc-300">Builder opens laptop…</p>
          </div>
        )}

        {/* SCENE 1 — site */}
        {scene === 1 && (
          <div
            key={`s1-${tick}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 pt-6"
            style={{ animation: "brand-enter 0.45s ease-out both" }}
          >
            <div
              className="w-[min(92%,360px)] overflow-hidden rounded-xl border-2 border-zinc-500 bg-zinc-950 shadow-[0_0_48px_rgba(0,255,153,0.25)]"
              style={{ animation: "brand-scale-in 0.5s ease-out both" }}
            >
              <div className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-900 px-2 py-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <span className="ml-1 flex-1 truncate rounded bg-white/5 px-2 py-0.5 text-center font-mono text-[9px] text-zinc-400">
                  prompt-market-ritual.vercel.app
                </span>
              </div>
              <div className="space-y-2.5 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#00ff99] text-[11px] font-bold text-black shadow-[0_0_16px_rgba(0,255,153,0.6)]">
                    P
                  </span>
                  <span className="text-sm font-semibold text-white">Prompt Market</span>
                </div>
                <p className="text-xs font-medium text-white">Agent marketplace infrastructure</p>
                <p className="text-[11px] text-zinc-500">for AI-native teams on Ritual Chain</p>
                <div className="flex gap-2 pt-1">
                  <span
                    className="rounded-md bg-[#00ff99] px-3 py-1.5 text-[11px] font-semibold text-black"
                    style={{ animation: "brand-btn-glow 1.4s ease-in-out infinite" }}
                  >
                    Get Started
                  </span>
                  <span className="rounded-md border border-zinc-600 px-3 py-1.5 text-[11px] text-zinc-300">
                    Dashboard
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 2 — deploy */}
        {scene === 2 && (
          <div
            key={`s2-${tick}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 pt-6"
            style={{ animation: "brand-enter 0.45s ease-out both" }}
          >
            <div className="flex items-center gap-5 sm:gap-10">
              <div className="hidden flex-col items-center sm:flex">
                <div className="h-11 w-11 rounded-full bg-[#f0c9a0]" />
                <div className="mt-1 h-11 w-14 rounded-t-2xl bg-[#1e3a5f]" />
                <p className="mt-1 text-[10px] text-zinc-500">You</p>
              </div>
              <div
                className="text-3xl font-bold text-[#00ff99]"
                style={{ animation: "brand-arrow-move 0.8s ease-in-out infinite" }}
              >
                →
              </div>
              <div className="flex flex-col items-center" style={{ animation: "brand-scale-in 0.55s ease-out both" }}>
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#00ff99] bg-[#00ff99]/20 text-4xl shadow-[0_0_40px_rgba(0,255,153,0.55)] sm:h-24 sm:w-24 sm:text-5xl"
                  style={{ animation: "brand-pulse 1.1s ease-in-out infinite" }}
                >
                  🤖
                </div>
                <p className="mt-2 font-mono text-sm font-semibold text-[#00ff99]">Agent deployed</p>
                <p className="text-[11px] text-zinc-500">skills · bond · live</p>
              </div>
            </div>
            <div
              className="rounded-lg bg-[#00ff99] px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(0,255,153,0.55)]"
              style={{ animation: "brand-btn-glow 1.2s ease-in-out infinite" }}
            >
              Deploy agent ✓
            </div>
          </div>
        )}

        {/* SCENE 3 — people + notifs */}
        {scene === 3 && (
          <div
            key={`s3-${tick}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3 pt-6"
            style={{ animation: "brand-enter 0.45s ease-out both" }}
          >
            <div className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {PEOPLE.map((p, i) => (
                <div
                  key={p.name}
                  className="flex flex-col items-center rounded-xl border border-white/15 bg-zinc-900/95 p-2 shadow-lg sm:p-3"
                  style={{
                    animation: `brand-card-pop 0.45s ease-out ${i * 0.12}s both`,
                  }}
                >
                  <div className="mb-1.5 w-full rounded-lg border border-[#00ff99]/40 bg-black/80 px-1.5 py-1.5">
                    <div className="mb-0.5 flex items-center gap-1">
                      <span className="text-[11px]">{p.emoji}</span>
                      <span className="font-mono text-[8px] text-[#00ff99]">notif</span>
                      <span
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00ff99]"
                        style={{ animation: "brand-pulse 1s ease-in-out infinite" }}
                      />
                    </div>
                    <p className="text-[9px] leading-snug text-white/90">{p.task}</p>
                  </div>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-base"
                    style={{ background: p.color }}
                  >
                    👤
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-zinc-200">{p.name}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400">Tasks fan out to users in parallel</p>
          </div>
        )}

        {/* Progress bar for current scene */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
          <div
            className="h-full bg-[#00ff99] transition-[width] duration-75 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </section>
  )
}

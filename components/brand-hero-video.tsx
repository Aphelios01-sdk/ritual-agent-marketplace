"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Pause, Play, Volume2, VolumeX } from "lucide-react"

const CHAPTERS = [
  { t: 0, end: 5.3, n: "01", title: "Open laptop", body: "Builders start where work happens." },
  { t: 5.3, end: 10.6, n: "02", title: "Open Prompt Market", body: "Agent marketplace on Ritual Chain." },
  { t: 10.6, end: 15.9, n: "03", title: "Deploy agent", body: "Bond, install skills, go live." },
  { t: 15.9, end: 22, n: "04", title: "Tasks reach people", body: "Jobs fan out in parallel." },
] as const

/**
 * Full-width silent cinematic brand film for the marketing homepage hero.
 * Autoplay muted loop; chapter captions synced to video time.
 */
export function BrandHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [chapter, setChapter] = useState(0)
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const onTime = () => {
      const t = v.currentTime
      const dur = v.duration || 22
      setProgress(dur > 0 ? t / dur : 0)
      const idx = CHAPTERS.findIndex((c) => t >= c.t && t < c.end)
      if (idx >= 0) setChapter((prev) => (prev === idx ? prev : idx))
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onReady = () => setReady(true)

    v.addEventListener("timeupdate", onTime)
    v.addEventListener("play", onPlay)
    v.addEventListener("pause", onPause)
    v.addEventListener("loadeddata", onReady)
    v.addEventListener("canplay", onReady)

    // Autoplay policy (muted required)
    v.muted = true
    void v.play().catch(() => setPlaying(false))

    return () => {
      v.removeEventListener("timeupdate", onTime)
      v.removeEventListener("play", onPlay)
      v.removeEventListener("pause", onPause)
      v.removeEventListener("loadeddata", onReady)
      v.removeEventListener("canplay", onReady)
    }
  }, [])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play()
    else v.pause()
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const seekChapter = (i: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = CHAPTERS[i].t + 0.05
    setChapter(i)
    void v.play()
  }

  const ch = CHAPTERS[chapter]

  return (
    <section className="relative w-full overflow-hidden border-b border-border/40 bg-black">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(0,255,153,0.12), transparent 55%), linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1400px]">
        <div className="relative aspect-[16/9] w-full max-h-[min(78vh,820px)] min-h-[280px] sm:min-h-[360px]">
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
            src="/brand-story.mp4"
            poster="/brand-story-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Prompt Market brand film: open laptop, open marketplace, deploy agent, notify users"
          />
          {/* Poster fallback while loading */}
          {!ready && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/brand-story-poster.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Top bar */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00ff99]" />
              <span className="font-mono text-[10px] tracking-[0.18em] text-white/70 sm:text-[11px]">
                PROMPT MARKET · BRAND FILM
              </span>
            </div>
            <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 font-mono text-[10px] text-white/60 backdrop-blur-md">
              SILENT LOOP · 22s
            </span>
          </div>

          {/* Chapter caption */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-16 pt-20 sm:px-8 sm:pb-20">
            <div className="max-w-xl">
              <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-[#00ff99]">
                {ch.n} / 04
              </p>
              <h2
                key={ch.n}
                className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
                style={{ animation: "brand-enter 0.45s ease-out both" }}
              >
                {ch.title}
              </h2>
              <p
                key={`${ch.n}-b`}
                className="mt-2 max-w-md text-sm text-white/65 sm:text-base"
                style={{ animation: "brand-enter 0.5s ease-out 0.05s both" }}
              >
                {ch.body}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#00ff99] px-4 text-sm font-semibold text-black shadow-[0_0_24px_rgba(0,255,153,0.35)] transition hover:brightness-110"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 opacity-70" />
                </Link>
                <Link
                  href="/create"
                  className="inline-flex h-10 items-center rounded-lg border border-white/20 bg-white/5 px-4 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:bg-white/10"
                >
                  Deploy agent
                </Link>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-3 sm:px-8">
            <div className="mb-2 flex items-center gap-2">
              {CHAPTERS.map((c, i) => (
                <button
                  key={c.n}
                  type="button"
                  onClick={() => seekChapter(i)}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i === chapter ? "bg-[#00ff99]" : i < chapter ? "bg-[#00ff99]/45" : "bg-white/20"
                  }`}
                  aria-label={`Chapter ${c.n}: ${c.title}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 pl-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <span className="ml-1 hidden font-mono text-[10px] text-white/50 sm:inline">
                  {ch.title}
                </span>
              </div>
              <div className="h-0.5 w-24 overflow-hidden rounded-full bg-white/15 sm:w-40">
                <div
                  className="h-full bg-[#00ff99] transition-[width] duration-150 ease-linear"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

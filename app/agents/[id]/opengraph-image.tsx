import { ImageResponse } from "next/og"
import { fetchAgents } from "@/lib/onchain"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let name = `Agent #${id}`
  let rating = "·"
  let jobs = "0"
  let desc = "On chain agent on Ritual Agentry"
  let letter = "A"

  try {
    const agents = await fetchAgents()
    const a = agents.find((x) => x.id === id)
    if (a) {
      name = a.name
      letter = a.name.charAt(0).toUpperCase() || "A"
      rating = a.avgRating ? a.avgRating.toFixed(2) : "·"
      jobs = String(a.jobCount)
      desc = (a.description || desc).slice(0, 120)
    }
  } catch {
    /* fallback */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear gradient(145deg, #0a0a0a 0%, #0d1f18 50%, #0a0a0a 100%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#00ff99",
              boxShadow: "0 0 20px #00ff99",
            }}
          />
          <span style={{ fontSize: 22, color: "#a1a1aa" }}>Ritual Agentry · Ritual</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "rgba(0,255,153,0.12)",
              border: "2px solid rgba(0,255,153,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 700,
              color: "#00ff99",
            }}
          >
            {letter}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -2 }}>{name}</div>
            <div style={{ fontSize: 24, color: "#a1a1aa", maxWidth: 860 }}>{desc}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 40, fontSize: 24, color: "#00ff99" }}>
          <span>Rating {rating}</span>
          <span>{jobs} jobs</span>
          <span>Hire on chain</span>
        </div>
      </div>
    ),
    { ...size },
  )
}

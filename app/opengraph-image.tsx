import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Ritual Agentry — autonomous agent economy on Ritual Chain"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#f5f5f5",
          padding: "72px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9999,
              background: "#bff009",
              boxShadow: "0 0 24px #bff009",
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>
            Ritual Agentry
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.02,
              maxWidth: 980,
            }}
          >
            Autonomous agent economy on Ritual Chain
          </div>
          <div style={{ fontSize: 30, color: "#a3a3a3", maxWidth: 900 }}>
            Deploy agents, post tasks, bid, and settle escrowed RIT — on chain,
            chainId 1979.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#737373",
            fontFamily: "monospace",
          }}
        >
          <span>JobMarketV2 · AgentRegistry · Escrow</span>
          <span>ritual-agentry.vercel.app</span>
        </div>
      </div>
    ),
    { ...size }
  )
}

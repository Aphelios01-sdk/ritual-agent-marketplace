import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Skill pipeline demo — HTTP path hits public APIs; LLM path does lightweight
 * heuristic analysis (no external key required). Mirrors precompile shape for UX.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const type = String(body.type || "LLM").toUpperCase()
    const input = String(body.input || "").trim()
    const skillName = String(body.skillName || "demo")

    if (!input) {
      return NextResponse.json({ error: "input required" }, { status: 400 })
    }

    if (type === "HTTP") {
      // CoinGecko-style price demo for token symbols / ids
      const id = input.toLowerCase().replace(/[^a-z0-9-]/g, "") || "bitcoin"
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd,usd_24h_change`
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 30 },
      })
      if (!res.ok) {
        // fallback synthetic
        return NextResponse.json({
          skillName,
          type: "HTTP",
          result: {
            note: "upstream rate limited; synthetic demo payload",
            query: id,
            usd: 0,
            status: res.status,
          },
        })
      }
      const data = await res.json()
      return NextResponse.json({
        skillName,
        type: "HTTP",
        precompile: "0x…0801",
        result: data[id] || data,
        source: "coingecko",
      })
    }

    // LLM-style: simple sentiment + keywords (no paid API)
    const lower = input.toLowerCase()
    const pos = ["good", "great", "bull", "up", "win", "success", "love", "strong", "growth"]
    const neg = ["bad", "bear", "down", "fail", "hate", "weak", "risk", "slash", "hack"]
    let score = 0
    for (const w of pos) if (lower.includes(w)) score += 1
    for (const w of neg) if (lower.includes(w)) score -= 1
    const label = score > 0 ? "positive" : score < 0 ? "negative" : "neutral"
    const words = input.split(/\s+/).filter(Boolean)
    const summary =
      words.length <= 12
        ? input
        : words.slice(0, 12).join(" ") + "…"

    return NextResponse.json({
      skillName,
      type: "LLM",
      precompile: "0x…0802",
      model: "demo-heuristic (GLM-shaped)",
      result: {
        sentiment: label,
        score,
        summary,
        tokens: words.length,
        bullets: [
          `Input length: ${input.length} chars`,
          `Detected sentiment: ${label} (score ${score})`,
          "Escrow settlement path ready for on chain hire",
        ],
      },
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: detail }, { status: 500 })
  }
}

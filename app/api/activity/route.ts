import { NextResponse } from "next/server"
import { fetchRecentActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const data = await fetchRecentActivity()
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "activity-unreachable", detail },
      { status: 502 },
    )
  }
}

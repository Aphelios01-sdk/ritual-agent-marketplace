import { NextResponse } from "next/server"
import { fetchJobs, fetchJob, fetchBids, serializeJob } from "@/lib/onchain"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Live jobs snapshot for client polling (always fresh from chain). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (id) {
      const [job, bids] = await Promise.all([fetchJob(id), fetchBids(id)])
      if (!job) {
        return NextResponse.json({ error: "not-found" }, { status: 404 })
      }
      return NextResponse.json(
        {
          job: serializeJob(job),
          bids: bids.map((b) => ({
            provider: b.provider,
            price: b.price.toString(),
            estBlocks: b.estBlocks.toString(),
            submittedAt: b.submittedAt.toString(),
          })),
          ts: Date.now(),
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      )
    }

    const jobs = await fetchJobs({ fresh: true })
    return NextResponse.json(
      {
        jobs: jobs.map(serializeJob),
        open: jobs.filter((j) => j.status === "OPEN").length,
        active: jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length,
        done: jobs.filter((j) => j.status === "COMPLETED").length,
        ts: Date.now(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    )
  } catch {
    return NextResponse.json({ error: "rpc-unreachable" }, { status: 502 })
  }
}

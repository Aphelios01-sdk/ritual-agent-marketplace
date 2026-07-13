import type { Metadata } from "next"
import { DisputesPageClient } from "@/components/disputes-page-client"
import { fetchJobs } from "@/lib/onchain"
import type { JobStatus } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Disputes",
  description: "Dispute council board: evaluate contested jobs and keep the marketplace fair.",
}

export const revalidate = 8

export default async function DisputesPage() {
  const jobs = await fetchJobs()
  const disputed = jobs
    .filter((j) => j.status === "DISPUTED")
    .map((j) => ({
      id: String(j.id),
      taskData: j.taskData || "",
      status: j.status as JobStatus,
    }))
  const openish = jobs.filter(
    (j) => j.status === "OPEN" || j.status === "IN_PROGRESS" || j.status === "ASSIGNED",
  )

  return <DisputesPageClient disputed={disputed} openishCount={openish.length} />
}

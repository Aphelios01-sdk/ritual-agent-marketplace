import type { Metadata } from "next"
import { fetchJobs } from "@/lib/onchain"
import { JobsPageClient } from "@/components/jobs-page-client"

export const metadata: Metadata = {
  title: "Tasks",
  description:
    "Task marketplace on Ritual Chain: post jobs, bid with skills, earn escrowed RIT. Live open / active / done board.",
}

export const dynamic = "force-dynamic"

export default async function JobsPage() {
  const jobs = await fetchJobs({ fresh: true })
  return <JobsPageClient jobs={jobs} />
}

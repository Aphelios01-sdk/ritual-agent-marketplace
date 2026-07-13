import type { Metadata } from "next"
import { SkillsPageClient } from "@/components/skills-page-client"
import { fetchAgents } from "@/lib/onchain"

export const metadata: Metadata = { title: "Skills" }
export const revalidate = 8

export default async function SkillsPage() {
  const agents = await fetchAgents()
  return <SkillsPageClient agentCount={agents.length} />
}

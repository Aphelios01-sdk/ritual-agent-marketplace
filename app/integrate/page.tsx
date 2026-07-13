import type { Metadata } from "next"
import { IntegratePageClient } from "@/components/integrate-page-client"

export const metadata: Metadata = {
  title: "Integrate via MCP",
  description:
    "Connect a Ritual agent to Ritual Agentry through the MCP server. No browser wallet connect.",
}

export default function IntegratePage() {
  return <IntegratePageClient />
}

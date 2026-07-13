import type { Metadata } from "next"
import { DocsPageClient } from "@/components/docs-page-client"

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Ritual Agent Marketplace documentation: project overview, features, how it works, full installation guide, and on chain contract addresses.",
}

export default function DocsPage() {
  return <DocsPageClient />
}

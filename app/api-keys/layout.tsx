import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Keys",
  description: "Manage local gateway API keys for Prompt Market bots and integrations.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

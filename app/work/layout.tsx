import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Work",
  description:
    "Agent inbox: paste an agent address to view assigned jobs, submit results, rate providers, and manage your on-chain workload.",
}

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children
}

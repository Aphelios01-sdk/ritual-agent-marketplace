import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Faucet",
  description: "Claim test RIT for your Prompt Market agent wallet on Ritual Chain.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bond & Stake",
  description: "Stake RIT bond, request unstake, and ping agent heartbeat on Ritual Chain.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Job Templates",
  description: "One click job templates for Ritual Agentry on Ritual Chain.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

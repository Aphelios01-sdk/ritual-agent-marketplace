import type { Metadata } from "next"
import { TutorialPageClient } from "@/components/tutorial-page-client"

export const metadata: Metadata = {
  title: "Tutorial — Ritual Agent × Prompt Market",
  description:
    "Deploy or run an autonomous agent on Ritual Chain, then connect it to Prompt Market to bid, serve jobs, and earn escrowed RITUAL.",
}

export default function TutorialPage() {
  return <TutorialPageClient />
}

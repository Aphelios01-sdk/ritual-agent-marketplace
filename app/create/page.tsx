import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CreateAgentFlow } from "@/components/create-agent-flow"

export const metadata: Metadata = {
  title: "Create Agent",
}

export default function CreatePage() {
  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-8 max-w-[60ch] animate-fade-up">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Create</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">Launch a new agent</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Configure identity and profile photo, pick skills, then register on-chain, install skills, and stake RITUAL to activate. Publish the photo via AgentDirectory metadataURI so it appears across the marketplace.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Already running an agent from{" "}
            <a
              href="https://docs.ritualfoundation.org/#home"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Ritual docs
            </a>
            ? Use{" "}
            <Link href="/integrate" className="text-primary hover:underline">
              MCP integrate
            </Link>{" "}
            or the{" "}
            <Link href="/tutorial" className="text-primary hover:underline">
              full tutorial
            </Link>
            .
          </p>
        </div>
        <CreateAgentFlow />
      </section>
    </div>
  )
}

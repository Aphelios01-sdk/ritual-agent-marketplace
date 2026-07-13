import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { McpActionPanel } from "@/components/mcp-action-panel"
import { CodeBlock } from "@/components/ui/code-block"

export const metadata: Metadata = {
  title: "Create agent (MCP)",
  description: "Register and configure agents via Prompt Market MCP — no browser wallet.",
}

export default function CreatePage() {
  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-8 max-w-[60ch]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Create · MCP only
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.4rem] md:leading-[1.05]">
            Launch an agent via MCP
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Registration, skills, stake, heartbeat, and profile photo all run through the Prompt Market
            MCP server. The website does not sign transactions.
          </p>
        </div>

        <McpActionPanel surface="create" title="Create / integrate tools" />

        <div className="mt-6">
          <CodeBlock
            lang="bash"
            code={`export AGENT_PRIVATE_KEY=0x…
export RITUAL_RPC_URL=https://rpc.ritualfoundation.org
pnpm mcp
# Then: pm_integrate name="My Agent" stake_amount="0.1"`}
          />
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Full client config:{" "}
          <Link href="/integrate" className="underline-offset-4 hover:underline">
            /integrate
          </Link>
        </p>
      </section>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { McpIntegrate } from "@/components/mcp-integrate"
import { RITUAL_DOCS } from "@/lib/ritual-bridge"

export const metadata: Metadata = {
  title: "Integrate via MCP",
  description:
    "Connect a Ritual agent to Prompt Market through the MCP server — no browser wallet connect.",
}

export default function IntegratePage() {
  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <div className="mb-8 max-w-[60ch]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Integration
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.4rem] md:leading-[1.05]">
            Plug a Ritual agent into Prompt Market via MCP
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Agents from{" "}
            <a
              href={RITUAL_DOCS.home}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Ritual docs
            </a>{" "}
            integrate through the <strong className="font-medium text-foreground">Prompt Market MCP server</strong>.
            Your coding agent calls tools like <code className="font-mono text-xs">pm_integrate</code> —
            no MetaMask / wallet connect UI.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-md gap-1.5">
              <Link href="/tutorial">
                <BookOpen className="h-3.5 w-3.5" /> Tutorial
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-md gap-1.5">
              <a href={RITUAL_DOCS.faucet} target="_blank" rel="noreferrer">
                Faucet <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        <McpIntegrate />
      </section>
    </div>
  )
}

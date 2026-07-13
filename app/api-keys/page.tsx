import type { Metadata } from "next"
import Link from "next/link"
import { McpActionPanel } from "@/components/mcp-action-panel"
import { CodeBlock } from "@/components/ui/code-block"

export const metadata: Metadata = { title: "API / MCP keys" }

export default function ApiKeysPage() {
  return (
    <div className="inf-container max-w-2xl py-10 md:py-14">
      <p className="inf-eyebrow mb-2">Developer · MCP only</p>
      <h1 className="text-3xl font-semibold tracking-tight">Credentials</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Writes use <code className="font-mono text-xs">AGENT_PRIVATE_KEY</code> in the MCP process
        environment. Not browser API keys. Configure MCP once, never paste keys into the site.
      </p>
      <div className="mt-6">
        <CodeBlock
          lang="bash"
          code={`# In Claude / Cursor MCP env (not the browser):
AGENT_PRIVATE_KEY=0x…
RITUAL_RPC_URL=https://rpc.ritualfoundation.org
pnpm mcp`}
        />
      </div>
      <div className="mt-6">
        <McpActionPanel surface="create" title="Start with MCP" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/integrate" className="underline-offset-4 hover:underline">
          Full MCP setup →
        </Link>
      </p>
    </div>
  )
}

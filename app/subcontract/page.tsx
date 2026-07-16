import type { Metadata } from "next"
import { McpActionPanel } from "@/components/mcp-action-panel"
import { McpClientWizard } from "@/components/mcp-client-wizard"

export const metadata: Metadata = { title: "Subcontract (MCP)" }

export default function SubcontractPage() {
  return (
    <div className="inf-container max-w-2xl py-10 md:py-14">
      <p className="inf-eyebrow mb-2">Delegate · MCP only</p>
      <h1 className="text-3xl font-semibold tracking-tight">Subcontract</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Delegate sub-work by posting child jobs via MCP. No browser subcontract form.
      </p>
      <div className="mt-8">
        <McpActionPanel surface="subcontract" />
      </div>
      <div className="mt-6">
        <McpClientWizard />
      </div>
    </div>
  )
}

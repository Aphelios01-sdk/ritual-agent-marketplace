"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Wand2 } from "lucide-react"
import {
  CLIENT_TABS,
  type McpClientId,
  claudeDesktopJson,
  cursorMcpJson,
  hermesYaml,
  openclawAddCommand,
  mcporterAdd,
  cliSmoke,
} from "@/lib/mcp-client-configs"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/context"

type Props = {
  /** Default repo path shown in the input. */
  defaultRepoPath?: string
  className?: string
}

/**
 * Compact 1-click MCP client config wizard for the MCP-only pages.
 * Pick a client, edit repo path + key, copy the ready-to-paste config.
 * Lightweight sibling of the full /integrate surface.
 */
export function McpClientWizard({ defaultRepoPath, className }: Props) {
  const t = useT()
  const [tab, setTab] = useState<McpClientId>("claude")
  const [repoPath, setRepoPath] = useState(
    defaultRepoPath ?? "/path/to/ritual-agent-marketplace",
  )
  const [agentKey, setAgentKey] = useState("0xYOUR_AGENT_KEY")
  const [copied, setCopied] = useState(false)

  const serverPath = `${repoPath.replace(/\/$/, "")}/mcp/server.mjs`
  const key = agentKey.trim() || "0xYOUR_AGENT_KEY"

  const snippet = useMemo(() => {
    switch (tab) {
      case "claude":
        return claudeDesktopJson(serverPath, key)
      case "cursor":
        return cursorMcpJson(serverPath, key)
      case "hermes":
        return hermesYaml(serverPath, key)
      case "openclaw":
        return openclawAddCommand(serverPath, key)
      case "mcporter":
        return mcporterAdd(serverPath, key)
      case "cli":
        return cliSmoke()
      default:
        return claudeDesktopJson(serverPath, key)
    }
  }, [tab, serverPath, key])

  const lang = tab === "claude" || tab === "cursor" ? "json" : tab === "cli" || tab === "openclaw" || tab === "mcporter" ? "bash" : "yaml"

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={cn("rounded-lg border border-border p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t.mcp.clientConfig}</h3>
      </div>

      <div className="scrollbar-none -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-1">
        {CLIENT_TABS.map((ct) => (
          <button
            key={ct.id}
            type="button"
            onClick={() => setTab(ct.id)}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors",
              tab === ct.id
                ? "border-foreground bg-muted text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            title={ct.blurb}
          >
            {ct.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">
        {CLIENT_TABS.find((ct) => ct.id === tab)?.blurb}
      </p>

      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <label className="block text-xs">
          <span className="mb-1 block text-muted-foreground">{t.mcp.repoPath}</span>
          <input
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="/home/you/ritual-agent-marketplace"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-muted-foreground">{t.mcp.keyPlaceholder}</span>
          <input
            value={agentKey}
            onChange={(e) => setAgentKey(e.target.value)}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="0xYOUR_AGENT_KEY"
          />
        </label>
      </div>

      <div className="relative">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border/60 bg-muted/20 p-3 pr-12 font-mono text-[11px] leading-relaxed text-foreground/90">
          {snippet}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          title={t.common.copy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? t.common.copied : t.common.copy}
        </button>
      </div>
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        {lang.toUpperCase()} · MCP entry: {serverPath}
      </p>
    </div>
  )
}

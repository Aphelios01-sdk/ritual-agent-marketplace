"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink, Terminal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"
import { RITUAL_DOCS } from "@/lib/ritual-bridge"
import { cn } from "@/lib/utils"

const TOOLS = [
  { name: "pm_status", desc: "Chain block, signer, registration, stake" },
  { name: "pm_skill_catalog", desc: "Built-in HTTP/LLM skill IDs" },
  { name: "pm_list_agents", desc: "Browse registry" },
  { name: "pm_list_jobs", desc: "Open / active jobs" },
  { name: "pm_register_agent", desc: "Register signer on AgentRegistry" },
  { name: "pm_set_skills", desc: "Install marketplace skills" },
  { name: "pm_stake", desc: "Post bond" },
  { name: "pm_heartbeat", desc: "Liveness ping" },
  { name: "pm_integrate", desc: "One-shot: register + skills + stake + heartbeat" },
  { name: "pm_submit_bid", desc: "Bid on a job" },
  { name: "pm_start_processing", desc: "Start job + bond" },
  { name: "pm_submit_result", desc: "Deliver result" },
  { name: "pm_set_profile", desc: "Avatar / metadataURI" },
]

type Tab = "claude" | "cursor" | "mcporter" | "cli"

/**
 * MCP-first integrate surface — no browser wallet connect.
 * Agent operators run the local MCP server with AGENT_PRIVATE_KEY in env.
 */
export function McpIntegrate() {
  const [tab, setTab] = useState<Tab>("claude")
  const [repoPath, setRepoPath] = useState("/path/to/ritual-agent-marketplace")
  const [copied, setCopied] = useState<string | null>(null)

  const nodeBin = "node"
  const serverPath = `${repoPath.replace(/\/$/, "")}/mcp/server.mjs`

  const claudeConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            "prompt-market": {
              command: nodeBin,
              args: [serverPath],
              env: {
                AGENT_PRIVATE_KEY: "0xYOUR_AGENT_KEY",
                RITUAL_RPC_URL: "https://rpc.ritualfoundation.org",
              },
            },
          },
        },
        null,
        2,
      ),
    [serverPath],
  )

  const cursorConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            "prompt-market": {
              command: nodeBin,
              args: [serverPath],
              env: {
                AGENT_PRIVATE_KEY: "0xYOUR_AGENT_KEY",
                RITUAL_RPC_URL: "https://rpc.ritualfoundation.org",
              },
            },
          },
        },
        null,
        2,
      ),
    [serverPath],
  )

  const mcporterSnippet = `mcporter config add prompt-market \\
  --command node \\
  --arg "${serverPath}" \\
  --env AGENT_PRIVATE_KEY=0xYOUR_AGENT_KEY \\
  --env RITUAL_RPC_URL=https://rpc.ritualfoundation.org`

  const integratePrompt = `Integrate my Ritual agent with Prompt Market via MCP:
1. pm_status — check balance and registration
2. If unregistered: pm_integrate with name "My Ritual Agent" and stake_amount "0.1"
3. pm_list_jobs status OPEN
4. Bid on a matching job with pm_submit_bid`

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore */
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "claude", label: "Claude Desktop" },
    { id: "cursor", label: "Cursor / Grok" },
    { id: "mcporter", label: "mcporter" },
    { id: "cli", label: "CLI test" },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="space-y-4 p-5 md:p-6">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              MCP bridge
            </p>
            <h3 className="text-lg font-semibold">Integrate via Prompt Market MCP</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No browser wallet connect. Your AI client (Claude, Cursor, Grok, Hermes) calls MCP tools;
              the local server signs on-chain with <code className="font-mono text-xs">AGENT_PRIVATE_KEY</code>{" "}
              from environment only.
            </p>
          </div>

          <ol className="space-y-3 text-sm">
            {[
              {
                t: "Clone & install",
                d: "Get the repo so mcp/server.mjs can run with Node 22+.",
              },
              {
                t: "Fund the agent EOA",
                d: "Same address derived from AGENT_PRIVATE_KEY. Use the Ritual faucet for gas + stake.",
              },
              {
                t: "Register MCP in your client",
                d: "Paste config below. Key stays in local env — never in the website.",
              },
              {
                t: "Ask the agent to integrate",
                d: "Use pm_integrate or step tools: register → skills → stake → heartbeat → bid.",
              },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border font-mono text-[11px]">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{s.t}</p>
                  <p className="text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href={RITUAL_DOCS.faucet}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Faucet <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={RITUAL_DOCS.docs}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Ritual docs <ExternalLink className="h-3 w-3" />
            </a>
            <Link href="/tutorial" className="text-muted-foreground hover:text-foreground">
              Full tutorial
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="space-y-4 p-5 md:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="font-semibold">Server path</h4>
              <p className="text-xs text-muted-foreground">Absolute path to this repo on your machine</p>
            </div>
          </div>
          <input
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 font-mono text-xs outline-none ring-ring focus-visible:ring-2"
            placeholder="/home/you/ritual-agent-marketplace"
          />
          <CodeBlock
            title="install"
            lang="bash"
            code={`git clone https://github.com/Aphelios01-sdk/ritual-agent-marketplace.git
cd ritual-agent-marketplace
pnpm install
# optional smoke test (writes need AGENT_PRIVATE_KEY):
AGENT_PRIVATE_KEY=0x… pnpm mcp`}
          />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="space-y-4 p-5 md:p-6">
          <h4 className="font-semibold">Client config</h4>
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                  tab === t.id
                    ? "border-foreground bg-muted text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "claude" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Claude Desktop → Settings → Developer → Edit Config (
                <code className="font-mono">claude_desktop_config.json</code>)
              </p>
              <CodeBlock title="claude_desktop_config.json" lang="json" code={claudeConfig} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => copy("claude", claudeConfig)}
              >
                {copied === "claude" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy config
              </Button>
            </div>
          )}

          {tab === "cursor" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Cursor / Grok MCP settings — same shape as Claude. Merge under{" "}
                <code className="font-mono">mcpServers</code>.
              </p>
              <CodeBlock title="mcp.json" lang="json" code={cursorConfig} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => copy("cursor", cursorConfig)}
              >
                {copied === "cursor" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy config
              </Button>
            </div>
          )}

          {tab === "mcporter" && (
            <div className="space-y-2">
              <CodeBlock title="mcporter" lang="bash" code={mcporterSnippet} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => copy("mcporter", mcporterSnippet)}
              >
                {copied === "mcporter" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy command
              </Button>
            </div>
          )}

          {tab === "cli" && (
            <div className="space-y-2">
              <CodeBlock
                title="manual"
                lang="bash"
                code={`export AGENT_PRIVATE_KEY=0x…
export RITUAL_RPC_URL=https://rpc.ritualfoundation.org
pnpm mcp
# server speaks MCP on stdio — use an MCP host, not raw terminal chat`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="space-y-3 p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold">Example agent prompt</h4>
          </div>
          <CodeBlock title="prompt" lang="text" code={integratePrompt} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => copy("prompt", integratePrompt)}
          >
            {copied === "prompt" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy prompt
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-5 md:p-6">
          <h4 className="mb-3 font-semibold">MCP tools</h4>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {TOOLS.map((t) => (
              <li key={t.name} className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <code className="font-mono text-xs font-medium">{t.name}</code>
                <span className="text-xs text-muted-foreground">{t.desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Write tools require <Badge variant="secondary" className="mx-0.5 font-mono text-[10px]">AGENT_PRIVATE_KEY</Badge>{" "}
            in the MCP process environment. Read tools work without it.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

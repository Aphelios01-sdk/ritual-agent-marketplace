"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink, Terminal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"
import { RITUAL_DOCS } from "@/lib/ritual-bridge"
import {
  CLIENT_TABS,
  type McpClientId,
  claudeDesktopJson,
  cursorMcpJson,
  hermesYaml,
  openclawAddCommand,
  openclawJson,
  ritualAgentYaml,
  ritualAgentBootstrapSh,
  mcporterAdd,
  cliSmoke,
} from "@/lib/mcp-client-configs"
import { cn } from "@/lib/utils"

const TOOLS = [
  { name: "pm_status", desc: "Chain block, signer, registration, stake" },
  { name: "pm_skill_catalog", desc: "Built-in HTTP/LLM skill IDs" },
  { name: "pm_list_agents", desc: "Browse registry" },
  { name: "pm_list_jobs", desc: "Open / active jobs" },
  { name: "pm_post_job", desc: "USER: post job + escrow" },
  { name: "pm_list_bids", desc: "USER: list bids" },
  { name: "pm_assign_job", desc: "USER: assign bid" },
  { name: "pm_rate", desc: "USER: rate provider 1–5" },
  { name: "pm_dispute_job", desc: "USER: open dispute" },
  { name: "pm_integrate", desc: "ASP: register + skills + stake + heartbeat" },
  { name: "pm_submit_bid", desc: "ASP: bid on job" },
  { name: "pm_start_processing", desc: "ASP: start + bond" },
  { name: "pm_submit_result", desc: "ASP: deliver result" },
  { name: "pm_stake_verifier", desc: "EVALUATOR: stake council" },
  { name: "pm_list_disputes", desc: "EVALUATOR: list disputes" },
  { name: "pm_vote_dispute", desc: "EVALUATOR: vote requester|provider" },
  { name: "pm_set_profile", desc: "Avatar / metadataURI" },
]

/**
 * MCP integrate surface — client configs for Hermes, OpenClaw, Ritual agents, etc.
 */
export function McpIntegrate() {
  const [tab, setTab] = useState<McpClientId>("hermes")
  const [repoPath, setRepoPath] = useState("/path/to/ritual-agent-marketplace")
  const [agentKey, setAgentKey] = useState("0xYOUR_AGENT_KEY")
  const [copied, setCopied] = useState<string | null>(null)

  const serverPath = `${repoPath.replace(/\/$/, "")}/mcp/server.mjs`
  const key = agentKey.trim() || "0xYOUR_AGENT_KEY"

  const snippets = useMemo(
    () => ({
      hermes: hermesYaml(serverPath, key),
      openclaw: openclawAddCommand(serverPath, key),
      openclawJson: openclawJson(serverPath, key),
      ritual: ritualAgentYaml(serverPath, key),
      ritualSh: ritualAgentBootstrapSh(serverPath),
      claude: claudeDesktopJson(serverPath, key),
      cursor: cursorMcpJson(serverPath, key),
      mcporter: mcporterAdd(serverPath, key),
      cli: cliSmoke(),
    }),
    [serverPath, key],
  )

  const integratePrompt = `You have Prompt Market MCP (prompt-market). Operate as a Ritual chain agent:
1. pm_status
2. If not registered: pm_integrate name="Ritual Agent" stake_amount="0.1"
3. pm_list_jobs status=OPEN
4. Bid / assign / deliver per role (USER / ASP / EVALUATOR) using pm_* tools only`

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore */
    }
  }

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
              Wire <strong className="font-medium text-foreground">Hermes</strong>,{" "}
              <strong className="font-medium text-foreground">OpenClaw</strong>, or a{" "}
              <strong className="font-medium text-foreground">Ritual / Prompt Market agent</strong> to{" "}
              <code className="font-mono text-xs">mcp/server.mjs</code>. Signing uses{" "}
              <code className="font-mono text-xs">AGENT_PRIVATE_KEY</code> in the MCP process env only —
              never the website.
            </p>
          </div>

          <ol className="space-y-3 text-sm">
            {[
              {
                t: "Clone & install",
                d: "Repo on the machine that runs Hermes / OpenClaw / agent worker (Node 22+).",
              },
              {
                t: "Fund agent EOA",
                d: "Address from AGENT_PRIVATE_KEY. Faucet + optional RitualWallet for precompiles.",
              },
              {
                t: "Client config",
                d: "Pick Hermes, OpenClaw, or Ritual agent tab below and paste config.",
              },
              {
                t: "pm_integrate",
                d: "From the agent: register + skills + stake + heartbeat, then serve jobs.",
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
            <a
              href="https://docs.openclaw.ai/cli/mcp"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              OpenClaw MCP <ExternalLink className="h-3 w-3" />
            </a>
            <Link href="/tutorial" className="text-muted-foreground hover:text-foreground">
              Tutorial
            </Link>
            <Link href="/join" className="text-muted-foreground hover:text-foreground">
              Roles
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="space-y-4 p-5 md:p-6">
          <h4 className="font-semibold">Paths & key placeholder</h4>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Repo absolute path</span>
            <input
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 font-mono text-xs outline-none ring-ring focus-visible:ring-2"
              placeholder="/home/you/ritual-agent-marketplace"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              AGENT_PRIVATE_KEY placeholder (never paste a real key into production forms you do not control)
            </span>
            <input
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 font-mono text-xs outline-none ring-ring focus-visible:ring-2"
              placeholder="0xYOUR_AGENT_KEY"
            />
          </label>
          <p className="font-mono text-[10px] text-muted-foreground">MCP entry: {serverPath}</p>
          <CodeBlock
            title="install"
            lang="bash"
            code={`git clone https://github.com/Aphelios01-sdk/ritual-agent-marketplace.git
cd ritual-agent-marketplace && pnpm install
# smoke: AGENT_PRIVATE_KEY=0x… pnpm mcp`}
          />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="space-y-4 p-5 md:p-6">
          <h4 className="font-semibold">Client config</h4>
          <div className="flex flex-wrap gap-1.5">
            {CLIENT_TABS.map((t) => (
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
                title={t.blurb}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {CLIENT_TABS.find((t) => t.id === tab)?.blurb}
          </p>

          {tab === "hermes" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Hermes Agent reads MCP from <code className="font-mono">~/.hermes/config.yaml</code> →{" "}
                <code className="font-mono">mcp_servers</code>. Merge the block below, then restart Hermes /
                reload MCP.
              </p>
              <CodeBlock title="~/.hermes/config.yaml" lang="yaml" code={snippets.hermes} />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => copy("hermes", snippets.hermes)}>
                {copied === "hermes" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy Hermes config
              </Button>
            </div>
          )}

          {tab === "openclaw" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                OpenClaw as MCP <em>client</em>: register Prompt Market so OpenClaw agent runs can call{" "}
                <code className="font-mono">pm_*</code> tools. CLI:{" "}
                <a
                  href="https://docs.openclaw.ai/cli/mcp"
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  docs.openclaw.ai/cli/mcp
                </a>
                . Optional: use OpenClaw as harness with Ritual Sovereign Agent (
                <code className="font-mono text-[10px]">0x080C</code>).
              </p>
              <CodeBlock title="openclaw mcp add" lang="bash" code={snippets.openclaw} />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => copy("openclaw", snippets.openclaw)}>
                {copied === "openclaw" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy CLI
              </Button>
              <p className="text-xs text-muted-foreground">Or write config (mcp.servers):</p>
              <CodeBlock title="openclaw config · mcp.servers" lang="json" code={snippets.openclawJson} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => copy("openclawJson", snippets.openclawJson)}
              >
                {copied === "openclawJson" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy JSON
              </Button>
            </div>
          )}

          {tab === "ritual" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                For agents created / listed on <strong className="text-foreground">Prompt Market</strong> (this site)
                and runtimes from{" "}
                <a href={RITUAL_DOCS.home} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  Ritual docs
                </a>
                : same EOA as on-chain <code className="font-mono">agentContract</code>, MCP for marketplace
                settlement, optional Sovereign/Persistent harness (OpenClaw, Hermes, Claude Code, Crush).
              </p>
              <CodeBlock title="ritual-agent.yaml" lang="yaml" code={snippets.ritual} />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => copy("ritual", snippets.ritual)}>
                {copied === "ritual" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy agent config
              </Button>
              <CodeBlock title="bootstrap-ritual-agent.sh" lang="bash" code={snippets.ritualSh} />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => copy("ritualSh", snippets.ritualSh)}>
                {copied === "ritualSh" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy bootstrap script
              </Button>
              <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">First run checklist</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li>Fund EOA (faucet)</li>
                  <li>
                    <code className="font-mono">pm_integrate</code> → registry + skills + bond + heartbeat
                  </li>
                  <li>
                    Optional <code className="font-mono">pm_set_profile</code> for avatar
                  </li>
                  <li>
                    Loop jobs: <code className="font-mono">pm_list_jobs</code> → bid → result
                  </li>
                </ul>
              </div>
            </div>
          )}

          {tab === "claude" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Claude Desktop → Developer → Edit Config (
                <code className="font-mono">claude_desktop_config.json</code>)
              </p>
              <CodeBlock title="claude_desktop_config.json" lang="json" code={snippets.claude} />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => copy("claude", snippets.claude)}>
                {copied === "claude" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy config
              </Button>
            </div>
          )}

          {tab === "cursor" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Cursor / Grok MCP settings — merge under <code className="font-mono">mcpServers</code>.
              </p>
              <CodeBlock title="mcp.json" lang="json" code={snippets.cursor} />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => copy("cursor", snippets.cursor)}>
                {copied === "cursor" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy config
              </Button>
            </div>
          )}

          {tab === "mcporter" && (
            <div className="space-y-2">
              <CodeBlock title="mcporter" lang="bash" code={snippets.mcporter} />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => copy("mcporter", snippets.mcporter)}>
                {copied === "mcporter" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy command
              </Button>
            </div>
          )}

          {tab === "cli" && (
            <div className="space-y-2">
              <CodeBlock title="manual" lang="bash" code={snippets.cli} />
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
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => copy("prompt", integratePrompt)}>
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
              <li
                key={t.name}
                className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <code className="font-mono text-xs font-medium">{t.name}</code>
                <span className="text-xs text-muted-foreground">{t.desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Write tools need{" "}
            <Badge variant="secondary" className="mx-0.5 font-mono text-[10px]">
              AGENT_PRIVATE_KEY
            </Badge>{" "}
            in MCP env. Read tools work without it.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

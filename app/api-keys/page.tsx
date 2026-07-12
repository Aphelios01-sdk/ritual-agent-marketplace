"use client"

import { useEffect, useState } from "react"
import { Key, Plus, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type LocalApiKey,
} from "@/lib/agent-wallet"

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<LocalApiKey[]>([])
  const [name, setName] = useState("gateway")
  const [copied, setCopied] = useState<string | null>(null)
  const [created, setCreated] = useState<LocalApiKey | null>(null)

  const refresh = () => setKeys(listApiKeys())

  useEffect(() => {
    refresh()
  }, [])

  const add = () => {
    const k = createApiKey(name)
    setCreated(k)
    setName("gateway")
    refresh()
  }

  const copy = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopied(key)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div className="inf-container max-w-xl py-10 md:py-14">
      <div className="mb-8">
        <p className="inf-eyebrow mb-2">Developer</p>
        <h1 className="text-3xl font-semibold tracking-tight">API keys</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Local gateway tokens stored in your browser. Send as{" "}
          <code className="rounded bg-muted px-1 text-[11px]">Authorization: Bearer pm_…</code> to
          the API gateway.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Key className="h-4 w-4 text-[#00ff99]" />
          <p className="text-sm font-semibold">Create key</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 flex-1 rounded-full border border-border/60 bg-background px-3 text-sm"
            placeholder="Key name"
          />
          <Button
            className="h-10 gap-1.5 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
            onClick={add}
          >
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>
        {created && (
          <div className="mt-3 rounded-xl border border-[#00ff99]/30 bg-[#00ff99]/5 p-3">
            <p className="text-[11px] text-muted-foreground">Copy now — shown once in this session</p>
            <p className="mt-1 break-all font-mono text-xs text-[#00ff99]">{created.key}</p>
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {keys.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border/60 py-10 text-center text-xs text-muted-foreground">
            No keys yet
          </li>
        )}
        {keys.map((k) => (
          <li
            key={k.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{k.name}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {k.key.slice(0, 12)}…{k.key.slice(-6)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(k.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => copy(k.key)}
                aria-label="Copy"
              >
                {copied === k.key ? (
                  <Check className="h-3.5 w-3.5 text-[#00ff99]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-400"
                onClick={() => {
                  revokeApiKey(k.id)
                  refresh()
                }}
                aria-label="Revoke"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <pre className="mt-8 overflow-auto rounded-2xl border border-border/60 bg-black/40 p-4 font-mono text-[11px] text-zinc-400">
{`# Example gateway call
curl -s https://your-gateway/api/jobs \\
  -H "Authorization: Bearer pm_…"

# Agent runner
node scripts/agent-runner.mjs --key $AGENT_PK --poll 8`}
      </pre>
    </div>
  )
}

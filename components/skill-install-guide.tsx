"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, BookOpen, Check, Copy, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  title: string
  body: React.ReactNode
}

const PRECOMPILE_HTTP = "0x0000000000000000000000000000000000000801"
const PRECOMPILE_LLM = "0x0000000000000000000000000000000000000802"
const REGISTRY = "0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5"

function CodeBlock({ code, lang = "ts" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="group relative mt-2 overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <Terminal className="h-3 w-3" />
          {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </div>
  )
}

export function SkillInstallGuide() {
  const [open, setOpen] = useState(false)

  const steps: Step[] = [
    {
      title: "Pilih tipe precompile",
      body: (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Skill di Ritual Chain membungkus dua precompile native. Pilih sesuai kebutuhan:
          <br />
          <code className="font-mono text-foreground">{PRECOMPILE_HTTP}</code> — <b>HTTP</b> (fetch API/price feed)
          <br />
          <code className="font-mono text-foreground">{PRECOMPILE_LLM}</code> — <b>LLM</b> (inference model GLM-4.7)
        </p>
      ),
    },
    {
      title: "Susun struct Skill",
      body: (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Field wajib: <code className="font-mono text-foreground">skillId</code> (bytes32),{" "}
            <code className="font-mono text-foreground">name</code>,{" "}
            <code className="font-mono text-foreground">description</code>,{" "}
            <code className="font-mono text-foreground">precompileAddr</code>,{" "}
            <code className="font-mono text-foreground">configData</code> (bytes),{" "}
            <code className="font-mono text-foreground">active</code>.
          </p>
          <CodeBlock
            lang="ts"
            code={`import { encodePacked, keccak256, toBytes } from "viem"

const skillId = keccak256(toBytes("fetch-token-price")) // bytes32

// configData: untuk HTTP -> ABI-encode (url, method, headers)
const configData = encodePacked(
  ["string", "string", "string"],
  ["https://api.coingecko.com/api/v3/simple/price", "GET", "{}"],
)

const skill = {
  skillId,
  name: "fetch-token-price",
  description: "Fetch real-time token price from CoinGecko",
  precompileAddr: "${PRECOMPILE_HTTP}", // atau LLM
  configData,
  active: true,
}`}
          />
        </>
      ),
    },
    {
      title: "Pasang skill ke agent (setSkills)",
      body: (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Panggil <code className="font-mono text-foreground">setSkills(agentId, newSkills[])</code> di
            AgentRegistry. Hanya owner agent yang boleh.
          </p>
          <CodeBlock
            lang="ts"
            code={`import { useWriteContract } from "wagmi"
import { AGENT_REGISTRY_ABI } from "@/lib/contract-abi"

const { writeContractAsync } = useWriteContract()

await writeContractAsync({
  address: "${REGISTRY}",
  abi: AGENT_REGISTRY_ABI,
  functionName: "setSkills",
  args: [
    BigInt(1),     // agentId
    [skill],       // Skill[] — timpa seluruh daftar skill agent
  ],
})`}
          />
        </>
      ),
    },
    {
      title: "(Alternatif) Daftarkan agent baru dengan skill awal",
      body: (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Kalau agent belum ada, gunakan <code className="font-mono text-foreground">registerAgent</code> lalu{" "}
            <code className="font-mono text-foreground">setBond</code> untuk mengaktifkannya di marketplace.
          </p>
          <CodeBlock
            lang="ts"
            code={`await writeContractAsync({
  address: "${REGISTRY}",
  abi: AGENT_REGISTRY_ABI,
  functionName: "registerAgent",
  args: ["Crypto Sentiment Bot", "Analisis sentimen pasar", agentContract],
})
// lalu setBond(id, amount) untuk membond & memunculkan di grid`}
          />
        </>
      ),
    },
    {
      title: "Verifikasi skill tampil di marketplace",
      body: (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Baca <code className="font-mono text-foreground">getAgentSkills(agentId)</code> — skill baru langsung
            muncul di filter & detail agent.
          </p>
          <CodeBlock
            lang="ts"
            code={`const skills = await publicClient.readContract({
  address: "${REGISTRY}",
  abi: AGENT_REGISTRY_ABI,
  functionName: "getAgentSkills",
  args: [BigInt(1)],
})
console.log(skills) // [{ skillId, name, precompileAddr, active, ... }])`}
          />
        </>
      ),
    },
  ]

  return (
    <Card>
      <CardContent className="p-0">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-foreground/[0.02]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Tutorial: Cara Install Skill</p>
            <p className="truncate text-xs text-muted-foreground">
              Pasang capability HTTP / LLM ke agent on-chain dalam 5 langkah
            </p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="border-t border-border p-4">
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono text-[11px] font-semibold text-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <div className="mt-1">{s.body}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

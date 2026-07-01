"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CodeBlock } from "@/components/ui/code-block"
import { ChevronDown, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  title: string
  body: React.ReactNode
}

const PRECOMPILE_HTTP = "0x0000000000000000000000000000000000000801"
const PRECOMPILE_LLM = "0x0000000000000000000000000000000000000802"
const REGISTRY = "0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5"

export function SkillInstallGuide() {
  const [open, setOpen] = useState(false)

  const steps: Step[] = [
    {
      title: "Choose a precompile type",
      body: (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Skills on Ritual Chain wrap two native precompiles. Pick one based on your needs:
          <br />
          <code className="font-mono text-foreground">{PRECOMPILE_HTTP}</code> — <b>HTTP</b> (fetch APIs / price feeds)
          <br />
          <code className="font-mono text-foreground">{PRECOMPILE_LLM}</code> — <b>LLM</b> (GLM-4.7 model inference)
        </p>
      ),
    },
    {
      title: "Build the Skill struct",
      body: (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Required fields: <code className="font-mono text-foreground">skillId</code> (bytes32),{" "}
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

// configData: for HTTP -> ABI-encode (url, method, headers)
const configData = encodePacked(
  ["string", "string", "string"],
  ["https://api.coingecko.com/api/v3/simple/price", "GET", "{}"],
)

const skill = {
  skillId,
  name: "fetch-token-price",
  description: "Fetch real-time token price from CoinGecko",
  precompileAddr: "${PRECOMPILE_HTTP}", // or LLM
  configData,
  active: true,
}`}
          />
        </>
      ),
    },
    {
      title: "Attach the skill to an agent (setSkills)",
      body: (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Call <code className="font-mono text-foreground">setSkills(agentId, newSkills[])</code> on the
            AgentRegistry. Only the agent owner may do this.
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
    [skill],       // Skill[] — replaces the agent's full skill list
  ],
})`}
          />
        </>
      ),
    },
    {
      title: "(Alternative) Register a new agent with initial skills",
      body: (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            If the agent does not exist yet, use <code className="font-mono text-foreground">registerAgent</code> then{" "}
            <code className="font-mono text-foreground">setBond</code> to activate it in the marketplace.
          </p>
          <CodeBlock
            lang="ts"
            code={`await writeContractAsync({
  address: "${REGISTRY}",
  abi: AGENT_REGISTRY_ABI,
  functionName: "registerAgent",
  args: ["Crypto Sentiment Bot", "Crypto market sentiment analysis", agentContract],
})
// then setBond(id, amount) to bond & surface it in the grid`}
          />
        </>
      ),
    },
    {
      title: "Verify the skill appears in the marketplace",
      body: (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Read <code className="font-mono text-foreground">getAgentSkills(agentId)</code> — the new skill instantly
            shows up in the skill filter and agent detail view.
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
    <Card className="surface-card border-border/60">
      <CardContent className="p-0">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-foreground/[0.02]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Tutorial: How to install a skill</p>
            <p className="truncate text-xs text-muted-foreground">
              Attach an HTTP / LLM capability to an on-chain agent in 5 steps
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

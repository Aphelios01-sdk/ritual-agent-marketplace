"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { McpActionPanel } from "@/components/mcp-action-panel"
import { McpClientWizard } from "@/components/mcp-client-wizard"
import { CodeBlock } from "@/components/ui/code-block"
import { useT } from "@/lib/i18n/context"

export default function CreatePage() {
  const t = useT()
  return (
    <div className="min-h-[100dvh]">
      <section className="page-container max-w-3xl py-8 md:py-14">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> {t.common.back}
        </Link>
        <div className="mb-8 max-w-[60ch]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t.createPage.eyebrow}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-[2.4rem] md:leading-[1.05]">
            {t.createPage.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.createPage.body}</p>
        </div>

        <McpActionPanel surface="create" title={t.createPage.toolsTitle} />

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
          {t.createPage.fullConfig}{" "}
          <Link href="/integrate" className="underline-offset-4 hover:underline">
            /integrate
          </Link>
        </p>

        <div className="mt-6">
          <McpClientWizard />
        </div>
      </section>
    </div>
  )
}

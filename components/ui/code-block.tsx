"use client"

import { useState } from "react"
import { Check, Copy, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  code: string
  lang?: string
  title?: string
  className?: string
}

export function CodeBlock({ code, lang = "bash", title, className }: Props) {
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
    <div className={cn("group relative overflow-hidden rounded-xl border border-border/70 bg-muted/40", className)}>
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Terminal className="h-3 w-3" />
          {title ?? lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-xs leading-relaxed">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </div>
  )
}

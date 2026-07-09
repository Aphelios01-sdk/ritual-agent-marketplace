"use client"

import { useEffect, useState } from "react"
import { Wallet, Copy, Check, RefreshCw } from "lucide-react"
import { getAgentWallet, clearAgentWallet, type AgentWallet } from "@/lib/agent-wallet"
import { Button } from "@/components/ui/button"

export function AgentWalletBar() {
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      setWallet(getAgentWallet())
    } catch {
      /* SSR */
    }
  }, [])

  if (!wallet) return null

  const short = `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const reset = () => {
    if (!confirm("Generate a new agent wallet? Current local key will be cleared.")) return
    clearAgentWallet()
    setWallet(getAgentWallet())
  }

  return (
    <div className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-2 py-1 lg:flex">
      <Wallet className="h-3.5 w-3.5 text-primary" />
      <span className="font-mono text-[11px] text-muted-foreground">{short}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copy} aria-label="Copy address">
        {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={reset} aria-label="Reset wallet">
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  )
}

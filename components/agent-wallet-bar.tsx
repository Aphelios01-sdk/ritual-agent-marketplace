"use client"

import { useEffect, useState } from "react"
import { Wallet, Copy, Check, RefreshCw, Download } from "lucide-react"
import {
  getAgentWallet,
  clearAgentWallet,
  importAgentWallet,
  getBalance,
  exportPrivateKey,
  type AgentWallet,
} from "@/lib/agent-wallet"
import { Button } from "@/components/ui/button"
import { formatRitual, shortAddress } from "@/lib/utils"

export function AgentWalletBar() {
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const refresh = () => {
    try {
      const w = getAgentWallet()
      setWallet(w)
      getBalance(w.address).then(setBalance).catch(() => setBalance(BigInt(0)))
    } catch {
      /* SSR */
    }
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 15_000)
    return () => clearInterval(t)
  }, [])

  if (!wallet) return null

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
    refresh()
  }

  const doImport = () => {
    const pk = prompt("Paste private key (0x…)")
    if (!pk) return
    try {
      importAgentWallet(pk as `0x${string}`)
      refresh()
    } catch (e: any) {
      alert(e?.message || "Invalid key")
    }
  }

  const doExport = () => {
    const pk = exportPrivateKey()
    if (!pk) return
    if (confirm("Copy private key to clipboard? Keep it secret.")) {
      navigator.clipboard.writeText(pk)
    }
  }

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-2.5 py-1 transition-colors hover:border-[#00ff99]/30"
      >
        <Wallet className="h-3.5 w-3.5 text-[#00ff99]" />
        <span className="font-mono text-[11px] text-muted-foreground">
          {shortAddress(wallet.address)}
        </span>
        <span className="text-[10px] tabular-nums text-[#00ff99]/80">
          {formatRitual(balance)}
        </span>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border/50 bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Local agent wallet
            </p>
            <p className="break-all font-mono text-[11px]">{wallet.address}</p>
            <p className="mt-1 text-xs text-[#00ff99]">{formatRitual(balance)}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Button size="sm" variant="outline" className="h-7 gap-1 rounded-full text-[11px]" onClick={copy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 rounded-full text-[11px]" onClick={doImport}>
                <Download className="h-3 w-3" /> Import
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 rounded-full text-[11px]" onClick={doExport}>
                Export
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 rounded-full text-[11px]" onClick={reset}>
                <RefreshCw className="h-3 w-3" /> New
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

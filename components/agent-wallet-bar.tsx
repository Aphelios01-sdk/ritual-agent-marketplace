"use client"

import { useEffect, useState } from "react"
import { Wallet, Copy, Check, RefreshCw, Plug } from "lucide-react"
import {
  getAgentWallet,
  clearAgentWallet,
  connectBrowserWallet,
  tryReconnectBrowserWallet,
  getBalance,
  type AgentWallet,
} from "@/lib/agent-wallet"
import { Button } from "@/components/ui/button"
import { formatRitual, shortAddress, errMessage } from "@/lib/utils"

export function AgentWalletBar() {
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const apply = (w: AgentWallet) => {
    setWallet(w)
    getBalance(w.address).then(setBalance).catch(() => setBalance(BigInt(0)))
  }

  const refresh = async () => {
    try {
      const browser = await tryReconnectBrowserWallet()
      if (browser) {
        apply(browser)
        return
      }
      apply(getAgentWallet())
    } catch {
      /* SSR */
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only hydration
    void refresh()
    const t = setInterval(() => void refresh(), 15_000)
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

  const connectBrowser = async () => {
    setBusy(true)
    try {
      const w = await connectBrowserWallet()
      apply(w)
    } catch (e) {
      alert(errMessage(e) || "Could not connect wallet")
    } finally {
      setBusy(false)
    }
  }

  const useSession = () => {
    clearAgentWallet()
    apply(getAgentWallet())
  }

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 transition-colors hover:bg-muted"
      >
        <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-[11px] text-muted-foreground">
          {shortAddress(wallet.address)}
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground">
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
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-background p-3 shadow-lg">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {wallet.source === "browser" ? "Browser wallet" : "Session agent"}
            </p>
            <p className="break-all font-mono text-[11px]">{wallet.address}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatRitual(balance)} RITUAL</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={copy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-[11px]"
                onClick={connectBrowser}
                disabled={busy}
              >
                <Plug className="h-3 w-3" /> Connect
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={useSession}>
                <RefreshCw className="h-3 w-3" /> Session
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              No private key paste. Sign with your extension or a session agent.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

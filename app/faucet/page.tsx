"use client"

import { useEffect, useState } from "react"
import { Droplets, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAgentWallet, getBalance } from "@/lib/agent-wallet"
import { formatRitual, shortAddress } from "@/lib/utils"

export default function FaucetPage() {
  const [info, setInfo] = useState<any>(null)
  const [address, setAddress] = useState("")
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/faucet")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ enabled: false }))
    try {
      const w = getAgentWallet()
      setAddress(w.address)
      getBalance(w.address).then(setBalance)
    } catch {
      /* SSR */
    }
  }, [])

  const claim = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || "claim failed")
      setMsg(`Dripped ${data.amount} RITUAL · ${data.txHash}`)
      try {
        const w = getAgentWallet()
        setBalance(await getBalance(w.address))
      } catch {
        /* ignore */
      }
    } catch (e: any) {
      setMsg(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inf-container max-w-xl py-10 md:py-14">
      <div className="mb-8">
        <p className="inf-eyebrow mb-2">Onboarding</p>
        <h1 className="text-3xl font-semibold tracking-tight">Test RITUAL faucet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fund your local agent wallet so you can post jobs, stake bond, and bid on Ritual testnet.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Droplets className="h-4 w-4 text-[#00ff99]" />
          <p className="text-sm font-semibold">Claim drip</p>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-border/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Your wallet</p>
            <p className="font-mono text-xs">{address ? shortAddress(address, 6) : "—"}</p>
          </div>
          <div className="rounded-xl border border-border/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Balance</p>
            <p className="text-sm font-semibold tabular-nums">{formatRitual(balance)} RITUAL</p>
          </div>
        </div>

        <label className="mb-1 block text-xs text-muted-foreground">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-sm"
        />

        <p className="mb-3 text-xs text-muted-foreground">
          Amount: <strong>{info?.amount || "0.05"} RITUAL</strong>
          {info?.enabled === false && " · automatic faucet disabled (set FAUCET_PRIVATE_KEY)"}
          {info?.enabled && " · auto faucet online"}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || !address}
            className="h-10 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
            onClick={claim}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim test RITUAL"}
          </Button>
          {info?.explorer && (
            <a
              href={info.explorer}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-1 rounded-full border border-border/60 px-4 text-xs text-muted-foreground hover:text-foreground"
            >
              Explorer <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {info?.tip && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{info.tip}</p>
        )}
        {msg && <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{msg}</p>}
      </div>
    </div>
  )
}

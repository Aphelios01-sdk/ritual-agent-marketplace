"use client"

import { useEffect, useState } from "react"
import { Shield, Loader2, HeartPulse } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getAgentWallet,
  getBalance,
  stakeBond,
  requestUnstake,
  readStake,
  pingHeartbeat,
  type AgentWallet,
} from "@/lib/agent-wallet"
import { formatRitual, shortAddress } from "@/lib/utils"

export default function BondPage() {
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [stake, setStake] = useState<{
    amount: bigint
    lockedUntil: bigint
    strikes: bigint
    active: boolean
  } | null>(null)
  const [amount, setAmount] = useState("0.1")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = async (w: AgentWallet) => {
    const [bal, st] = await Promise.all([getBalance(w.address), readStake(w.address)])
    setBalance(bal)
    setStake(st)
  }

  useEffect(() => {
    try {
      const w = getAgentWallet()
      setWallet(w)
      refresh(w)
    } catch {
      /* SSR */
    }
  }, [])

  const act = async (fn: () => Promise<`0x${string}`>) => {
    if (!wallet) return
    setBusy(true)
    setMsg(null)
    try {
      const hash = await fn()
      setMsg(`Tx: ${hash}`)
      setTimeout(() => refresh(wallet), 2500)
    } catch (e: any) {
      setMsg(e?.shortMessage || e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inf-container max-w-2xl py-10 md:py-14">
      <p className="inf-eyebrow mb-2">Trust</p>
      <h1 className="text-3xl font-semibold tracking-tight">Bond & stake</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Stake RITUAL to bid on jobs. Heartbeat proves liveness. Strikes track slash history.
      </p>

      {wallet && (
        <p className="mt-4 font-mono text-xs text-[#00ff99]">{shortAddress(wallet.address, 6)}</p>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Card label="Wallet balance" value={`${formatRitual(balance)} RITUAL`} />
        <Card label="Bond locked" value={`${formatRitual(stake?.amount ?? BigInt(0))} RITUAL`} />
        <Card label="Strikes" value={String(stake?.strikes ?? 0)} />
        <Card label="Active stake" value={stake?.active ? "Yes" : "No"} />
      </div>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#00ff99]" />
          <p className="text-sm font-semibold">Stake bond</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10 w-32 rounded-full border border-border/60 bg-background px-3 text-sm"
            placeholder="0.1"
          />
          <Button
            disabled={busy || !wallet}
            className="h-10 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
            onClick={() =>
              act(() =>
                stakeBond(
                  wallet!,
                  BigInt(Math.floor(parseFloat(amount || "0") * 1e18)),
                ),
              )
            }
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Stake"}
          </Button>
          <Button
            variant="outline"
            disabled={busy || !wallet}
            className="h-10 rounded-full"
            onClick={() => act(() => requestUnstake(wallet!))}
          >
            Request unstake
          </Button>
          <Button
            variant="outline"
            disabled={busy || !wallet}
            className="h-10 gap-1.5 rounded-full"
            onClick={() => act(() => pingHeartbeat(wallet!))}
          >
            <HeartPulse className="h-3.5 w-3.5" /> Ping heartbeat
          </Button>
        </div>
        {msg && <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{msg}</p>}
      </div>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

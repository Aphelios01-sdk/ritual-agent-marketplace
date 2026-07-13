"use client"

import { useState } from "react"
import { Gavel, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAgentWallet, stakeAsVerifier, voteDispute } from "@/lib/agent-wallet"
import { toWei, errMessage } from "@/lib/utils"

export function DisputeActions() {
  const [stakeAmt, setStakeAmt] = useState("0.1")
  const [disputeId, setDisputeId] = useState("0")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const run = async (fn: () => Promise<`0x${string}`>) => {
    setBusy(true)
    setMsg(null)
    try {
      const hash = await fn()
      setMsg(`Tx: ${hash}`)
    } catch (e) {
      setMsg(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Gavel className="h-4 w-4 text-[#00ff99]" />
        <p className="text-sm font-semibold">Evaluator actions</p>
      </div>
      <p className="mb-4 text-[11px] text-muted-foreground">
        Stake as verifier on DisputeCouncil, then vote on open dispute IDs (0 = requester, 1 = provider).
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={stakeAmt}
          onChange={(e) => setStakeAmt(e.target.value)}
          className="h-9 w-28 rounded-full border border-border/60 bg-background px-3 text-sm"
          placeholder="0.1"
        />
        <Button
          size="sm"
          className="h-9 rounded-full bg-[#00ff99] text-black hover:bg-[#00ff99]/90"
          disabled={busy}
          onClick={() =>
            run(() =>
              stakeAsVerifier(
                getAgentWallet(),
                toWei(stakeAmt || "0"),
              ),
            )
          }
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Stake as verifier"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={disputeId}
          onChange={(e) => setDisputeId(e.target.value)}
          className="h-9 w-28 rounded-full border border-border/60 bg-background px-3 font-mono text-sm"
          placeholder="dispute id"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-full"
          disabled={busy}
          onClick={() => run(() => voteDispute(getAgentWallet(), BigInt(disputeId || "0"), 0))}
        >
          Vote requester
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-full"
          disabled={busy}
          onClick={() => run(() => voteDispute(getAgentWallet(), BigInt(disputeId || "0"), 1))}
        >
          Vote provider
        </Button>
      </div>
      {msg && <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{msg}</p>}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Save } from "lucide-react"
import { ProfilePhotoPicker } from "@/components/profile-photo-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  encodeMetadataURI,
  isUriTooLargeForChain,
  setLocalAvatar,
} from "@/lib/agent-profile"
import {
  getAgentWallet,
  setAgentAvatar,
  waitTx,
} from "@/lib/agent-wallet"
import { errMessage } from "@/lib/utils"
import type { Address } from "viem"

interface SetAgentAvatarProps {
  agentId: string
  agentName: string
  contractAddress: Address
  currentAvatarUrl?: string
  currentMetadataURI?: string
}

/**
 * Owner UI: set profile photo (local preview + optional on-chain setProfile).
 * On-chain write only succeeds if the local agent wallet is the registered agent contract.
 */
export function SetAgentAvatar({
  agentId,
  agentName,
  contractAddress,
  currentAvatarUrl,
  currentMetadataURI,
}: SetAgentAvatarProps) {
  const [image, setImage] = useState(currentAvatarUrl || "")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    try {
      const w = getAgentWallet()
      // eslint-disable-next-line react-hooks/set-state-in-effect -- owner check from local wallet
      setIsOwner(w.address.toLowerCase() === contractAddress.toLowerCase())
    } catch {
      setIsOwner(false)
    }
  }, [contractAddress])

  const saveLocal = () => {
    setLocalAvatar(contractAddress, image || null)
    setLocalAvatar(agentId, image || null)
    setMsg("Photo saved locally for this browser.")
    setErr(null)
  }

  const saveOnchain = async () => {
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      if (!image) {
        setErr("Choose a photo first")
        return
      }
      const uri = encodeMetadataURI({ image, existing: currentMetadataURI })
      if (isUriTooLargeForChain(uri)) {
        // Still keep local; warn about chain
        setLocalAvatar(contractAddress, image)
        setLocalAvatar(agentId, image)
        setErr(
          "Image is too large for on-chain metadata. Saved locally only — use a short HTTPS/IPFS URL for on-chain.",
        )
        return
      }
      const wallet = getAgentWallet()
      if (wallet.address.toLowerCase() !== contractAddress.toLowerCase()) {
        setErr("Local agent wallet is not this agent. Import the agent private key to update on-chain profile.")
        setLocalAvatar(contractAddress, image)
        setLocalAvatar(agentId, image)
        return
      }
      const hash = await setAgentAvatar(wallet, image, currentMetadataURI)
      setMsg(`Submitting tx ${hash.slice(0, 10)}…`)
      await waitTx(hash)
      setLocalAvatar(contractAddress, image)
      setLocalAvatar(agentId, image)
      setMsg("Profile photo updated on-chain.")
    } catch (e) {
      setErr(errMessage(e) || "On-chain update failed")
      // still persist locally so UI works
      setLocalAvatar(contractAddress, image || null)
      setLocalAvatar(agentId, image || null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="surface-card border-border/60">
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="font-semibold">Profile photo</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isOwner
              ? "You control this agent wallet — update the photo on-chain via AgentDirectory."
              : "Upload for local preview, or import this agent’s key to write on-chain metadataURI."}
          </p>
        </div>

        <ProfilePhotoPicker value={image} onChange={setImage} name={agentName} compact />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={saveLocal} disabled={busy}>
            <Save className="h-3.5 w-3.5" /> Save local
          </Button>
          <Button type="button" size="sm" className="gap-1.5" onClick={saveOnchain} disabled={busy || !image}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {busy ? "Writing…" : "Set on-chain"}
          </Button>
        </div>

        {msg && <p className="text-xs text-success">{msg}</p>}
        {err && <p className="text-xs text-destructive">{err}</p>}
      </CardContent>
    </Card>
  )
}

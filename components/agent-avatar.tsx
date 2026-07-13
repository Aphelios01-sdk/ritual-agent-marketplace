"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  resolveAvatar,
  toDisplayableImageUrl,
} from "@/lib/agent-profile"

type Size = "sm" | "md" | "lg" | "xl"

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-14 w-14 text-2xl",
}

interface AgentAvatarProps {
  name: string
  id?: string
  contractAddress?: string
  avatarUrl?: string
  size?: Size
  className?: string
  /** Extra class on the img element */
  imgClassName?: string
}

/**
 * Agent profile photo with letter fallback.
 * Merges on-chain avatarUrl with localStorage overlay (client-only).
 */
export function AgentAvatar({
  name,
  id,
  contractAddress,
  avatarUrl,
  size = "md",
  className,
  imgClassName,
}: AgentAvatarProps) {
  const [src, setSrc] = useState<string | undefined>(avatarUrl)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    const resolved = resolveAvatar({ id: id || "", contractAddress, avatarUrl })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate local overlay after mount
    setSrc(resolved)
    setBroken(false)
  }, [id, contractAddress, avatarUrl])

  const letter = (name || "?").charAt(0).toUpperCase()
  const showImg = Boolean(src) && !broken

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary/10 font-mono font-bold text-primary",
        SIZE_CLASS[size],
        className,
      )}
      aria-label={`${name} avatar`}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote/data/ipfs URLs; avoid next/image domain allowlist
        <img
          src={toDisplayableImageUrl(src!)}
          alt=""
          className={cn("h-full w-full object-cover", imgClassName)}
          onError={() => setBroken(true)}
        />
      ) : (
        <span>{letter}</span>
      )}
    </div>
  )
}

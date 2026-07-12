"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { estimateDeadline, formatBlocksAsDuration, toNum } from "@/lib/block-time"
import { RITUAL_AVG_BLOCK_MS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useLiveBlock } from "@/hooks/use-live-block"

type Props = {
  deadline: bigint | number | string
  /** Optional initial chain head from server */
  initialBlock?: number
  className?: string
  /** dense = one line for cards; full = two-line detail panel */
  variant?: "full" | "inline" | "compact"
}

/**
 * Converts a deadline block number (e.g. ~44.3M) into human ETA
 * using live chain head + Ritual avg block time (~200ms).
 */
export function BlockDeadline({
  deadline,
  initialBlock = 0,
  className,
  variant = "full",
}: Props) {
  const live = useLiveBlock(initialBlock, 3000)
  const [tick, setTick] = useState(0)

  // Recompute relative labels every 15s even if head is quiet
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 15_000)
    return () => clearInterval(t)
  }, [])

  const head = live.block > 0 ? live.block : initialBlock
  const est =
    head > 0
      ? estimateDeadline(deadline, head, { blockMs: RITUAL_AVG_BLOCK_MS })
      : null

  void tick // force re-render

  if (!est) {
    return (
      <span className={cn("font-mono text-xs text-muted-foreground", className)}>
        Block {toNum(deadline).toLocaleString()}
      </span>
    )
  }

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono text-[11px] tabular-nums",
          est.expired ? "text-red-400" : "text-muted-foreground",
          className,
        )}
        title={`Block ${est.deadlineBlock.toLocaleString()} · head ${est.currentBlock.toLocaleString()} · ~${est.blockMs}ms/block`}
      >
        <Clock className="h-3 w-3 opacity-70" />
        {est.compact}
      </span>
    )
  }

  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex flex-wrap items-center gap-x-1.5 text-xs",
          className,
        )}
        title={`Block ${est.deadlineBlock.toLocaleString()}`}
      >
        <span className={cn("font-medium", est.expired ? "text-red-400" : "text-foreground")}>
          {est.relative}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="font-mono text-muted-foreground">
          blk {est.deadlineBlock.toLocaleString()}
        </span>
      </span>
    )
  }

  // full
  return (
    <div className={cn("space-y-1 text-xs", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Deadline</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium",
            est.expired ? "text-red-400" : "text-[#00ff99]",
          )}
        >
          <Clock className="h-3 w-3" />
          {est.relative}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span>ETA</span>
        <span className="tabular-nums">{est.absolute}</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span>Block</span>
        <span className="font-mono tabular-nums">
          {est.deadlineBlock.toLocaleString()}
          <span className="mx-1 opacity-40">/</span>
          head {est.currentBlock.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span>Remaining</span>
        <span className="font-mono tabular-nums">
          {est.remainingBlocks > 0
            ? `${est.remainingBlocks.toLocaleString()} blocks`
            : "0 blocks"}
          <span className="ml-1 opacity-60">
            (~{RITUAL_AVG_BLOCK_MS}ms/blk)
          </span>
        </span>
      </div>
    </div>
  )
}

/** Show bid estBlocks as human duration. */
export function BlocksDuration({
  blocks,
  className,
}: {
  blocks: number | bigint | string
  className?: string
}) {
  const n = toNum(blocks)
  const dur = formatBlocksAsDuration(n)
  return (
    <span className={cn("tabular-nums", className)} title={`${n.toLocaleString()} blocks · ~${RITUAL_AVG_BLOCK_MS}ms each`}>
      {n.toLocaleString()} blocks
      <span className="text-muted-foreground"> · ~{dur}</span>
    </span>
  )
}

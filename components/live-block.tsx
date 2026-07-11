"use client"

import { useLiveBlock } from "@/hooks/use-live-block"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { cn } from "@/lib/utils"

interface Props {
  initialBlock?: number
  /** compact = header strip; card = larger KPI; inline = hero text */
  variant?: "inline" | "compact" | "card"
  className?: string
  showLabel?: boolean
  showDelta?: boolean
  showDot?: boolean
}

export function LiveBlock({
  initialBlock = 0,
  variant = "inline",
  className,
  showLabel = true,
  showDelta = true,
  showDot = true,
}: Props) {
  const { block, delta, online } = useLiveBlock(initialBlock, 2000)
  const value = block > 0 ? block : initialBlock

  if (variant === "card") {
    return (
      <div className={cn("inf-card relative p-4", className)}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">Chain block</p>
          {showDot && (
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  online ? "bg-[#00ff99]" : "bg-chart-3",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  online ? "bg-[#00ff99]" : "bg-chart-3",
                )}
              />
            </span>
          )}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">
          {value > 0 ? (
            <AnimatedNumber value={value} decimals={0} pulseOnIncrease duration={600} />
          ) : (
            "n/a"
          )}
        </p>
        <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{online ? "live on Ritual 1979" : "rpc offline"}</span>
          {showDelta && delta > 0 && (
            <span
              key={`${value}-${delta}`}
              className="live-block-delta font-mono font-medium text-[#00ff99]"
            >
              +{delta}
            </span>
          )}
        </p>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums",
          className,
        )}
        title={online ? "Live chain head" : "RPC offline"}
      >
        {showDot && (
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              online ? "bg-[#00ff99] shadow-[0_0_8px_#00ff99]" : "bg-chart-3",
            )}
          />
        )}
        {showLabel && <span className="text-muted-foreground">block</span>}
        {value > 0 ? (
          <AnimatedNumber
            value={value}
            decimals={0}
            pulseOnIncrease
            duration={500}
            className="font-medium text-foreground"
          />
        ) : (
          <span className="text-muted-foreground">n/a</span>
        )}
        {showDelta && delta > 0 && (
          <span key={`${value}-${delta}`} className="live-block-delta text-[#00ff99]">
            +{delta}
          </span>
        )}
      </span>
    )
  }

  // inline (hero)
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono tabular-nums", className)}>
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              online ? "bg-[#00ff99]" : "bg-chart-3",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              online ? "bg-[#00ff99]" : "bg-chart-3",
            )}
          />
        </span>
      )}
      {showLabel && <span className="text-muted-foreground">block</span>}
      {value > 0 ? (
        <AnimatedNumber value={value} decimals={0} pulseOnIncrease duration={500} className="text-foreground" />
      ) : (
        "n/a"
      )}
      {showDelta && delta > 0 && (
        <span key={`${value}-${delta}`} className="live-block-delta text-[11px] font-medium text-[#00ff99]">
          +{delta}
        </span>
      )}
    </span>
  )
}

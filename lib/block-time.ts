import { RITUAL_AVG_BLOCK_MS } from "./constants"

export type DeadlineEstimate = {
  deadlineBlock: number
  currentBlock: number
  remainingBlocks: number
  remainingMs: number
  eta: Date
  expired: boolean
  /** e.g. "in 12m 4s" / "expired 3m ago" */
  relative: string
  /** e.g. "Jul 12, 17:32 UTC" */
  absolute: string
  /** e.g. "~12m" compact */
  compact: string
  blockMs: number
}

export function toNum(v: bigint | number | string | null | undefined): number {
  if (v == null) return 0
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  if (typeof v === "bigint") return Number(v)
  try {
    return Number(BigInt(v))
  } catch {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
}

/** Convert N blocks → milliseconds using Ritual avg block time. */
export function blocksToMs(blocks: number | bigint, blockMs = RITUAL_AVG_BLOCK_MS): number {
  return Math.round(toNum(blocks) * blockMs)
}

/** Human duration from ms (absolute length, no "in/ago"). */
export function formatDuration(ms: number): string {
  const abs = Math.abs(ms)
  if (abs < 1000) return "<1s"
  const totalSec = Math.floor(abs / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  if (h < 48) return rm > 0 ? `${h}h ${rm}m` : `${h}h`
  const d = Math.floor(h / 24)
  const rh = h % 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}

export function formatDurationCompact(ms: number): string {
  const abs = Math.abs(ms)
  if (abs < 1000) return "<1s"
  const totalSec = Math.floor(abs / 1000)
  if (totalSec < 60) return `~${totalSec}s`
  const m = Math.floor(totalSec / 60)
  if (m < 60) return `~${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `~${h}h`
  return `~${Math.floor(h / 24)}d`
}

export function formatBlocksAsDuration(
  blocks: number | bigint,
  blockMs = RITUAL_AVG_BLOCK_MS,
): string {
  return formatDuration(blocksToMs(blocks, blockMs))
}

/**
 * Estimate wall-clock ETA for a deadline block number.
 * remaining = (deadline - head) * blockMs
 */
export function estimateDeadline(
  deadlineBlock: bigint | number | string,
  currentBlock: bigint | number | string,
  opts?: { nowMs?: number; blockMs?: number },
): DeadlineEstimate {
  const blockMs = opts?.blockMs ?? RITUAL_AVG_BLOCK_MS
  const nowMs = opts?.nowMs ?? Date.now()
  const dl = toNum(deadlineBlock)
  const head = toNum(currentBlock)
  const remainingBlocks = Math.trunc(dl - head)
  const remainingMs = remainingBlocks * blockMs
  const eta = new Date(nowMs + remainingMs)
  const expired = remainingBlocks <= 0

  const dur = formatDuration(remainingMs)
  const relative = expired
    ? remainingBlocks === 0
      ? "due now"
      : `expired ${dur} ago`
    : `in ${dur}`

  const absolute = eta.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return {
    deadlineBlock: dl,
    currentBlock: head,
    remainingBlocks,
    remainingMs,
    eta,
    expired,
    relative,
    absolute,
    compact: expired ? `−${formatDurationCompact(remainingMs).replace("~", "")}` : formatDurationCompact(remainingMs),
    blockMs,
  }
}

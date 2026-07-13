import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseEther } from "viem"
import type { SkillDefinition } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const RIT_AMOUNT_RE = /^\d+(\.\d+)?$/

/**
 * Parse a human RIT amount (e.g. "0.1", "12.5") to wei using viem's
 * fixed-point parser. Throws on invalid input — callers wrap in try/catch.
 *
 * Use this-instead of `BigInt(Math.floor(parseFloat(x) * 1e18))`, which loses
 * wei precision (e.g. "0.07" → 69999999999999987 instead of 70000000000000000).
 */
export function toWei(input: string | number): bigint {
  const s = (typeof input === "number" ? String(input) : (input ?? "")).trim()
  if (!RIT_AMOUNT_RE.test(s)) throw new Error("Invalid RIT amount")
  return parseEther(s)
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const

export function isZeroAddress(address?: string | null): boolean {
  if (!address) return true
  return address.toLowerCase() === ZERO_ADDRESS
}

/**
 * Short human address: 0xA29D…Ff5 (never full wei-style dumps).
 * Zero address → "unassigned".
 */
export function shortAddress(address?: string | null, left = 4, right = 3): string {
  if (!address) return "·"
  if (isZeroAddress(address)) return "unassigned"
  const a = address.trim()
  if (a.length < left + right + 2) return a
  return `${a.slice(0, 2 + left)}…${a.slice(-right)}`
}

/** @deprecated use shortAddress — kept for call sites */
export function truncateAddress(address: string, chars = 4): string {
  return shortAddress(address, chars, chars)
}

/**
 * Human-readable RIT amount from wei. Never shows raw wei.
 * Unit label: "RIT" (user-facing ticker).
 */
export function formatRitual(wei: bigint | string | number): string {
  const amount = toEthNumber(wei)
  if (!Number.isFinite(amount) || amount === 0) return "0 RIT"
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M RIT`
  if (amount >= 1000) return `${amount.toLocaleString("en-US", { maximumFractionDigits: 1 })} RIT`
  if (amount >= 1) return `${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} RIT`
  if (amount >= 0.0001) return `${amount.toFixed(4)} RIT`
  // dust but non-zero — avoid looking like wei
  return `<0.0001 RIT`
}

/** Amount only (no unit), for composing custom labels. */
export function formatRitualAmount(wei: bigint | string | number): string {
  const amount = toEthNumber(wei)
  if (!Number.isFinite(amount) || amount === 0) return "0"
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1000) return amount.toLocaleString("en-US", { maximumFractionDigits: 1 })
  if (amount >= 1) return amount.toLocaleString("en-US", { maximumFractionDigits: 4 })
  if (amount >= 0.0001) return amount.toFixed(4)
  return "<0.0001"
}

/** Alias preferred in new UI copy */
export const formatRit = formatRitual

export function formatRitualCompact(wei: bigint | string | number): string {
  return formatRitualAmount(wei)
}

function toEthNumber(wei: bigint | string | number): number {
  if (typeof wei === "number") {
    // if someone already passed eth units by mistake (< 1e12 treat as eth)
    if (Math.abs(wei) < 1e12) return wei
    return wei / 1e18
  }
  try {
    const b = typeof wei === "bigint" ? wei : BigInt(wei || "0")
    // use string divide for precision on large values
    const neg = b < BigInt(0)
    const abs = neg ? -b : b
    const whole = abs / BigInt(1e18)
    const frac = abs % BigInt(1e18)
    const fracStr = frac.toString().padStart(18, "0").slice(0, 8)
    const n = Number(`${whole}.${fracStr}`)
    return neg ? -n : n
  } catch {
    return 0
  }
}

/** Extract a short human message from a caught value (Error, viem error, string). */
export function errMessage(e: unknown): string {
  if (e && typeof e === "object") {
    const v = e as { shortMessage?: string; message?: string; details?: string }
    if (v.shortMessage) return v.shortMessage
    if (v.details) return v.details
    if (v.message) return v.message
  }
  if (typeof e === "string") return e
  return String(e)
}

export function formatRating(rating: number): string {
  if (!Number.isFinite(rating)) return "·"
  return rating.toFixed(1)
}

export function formatBond(wei: bigint | string): string {
  return formatRitual(wei)
}

export function getSkillBadgeColor(type: "HTTP" | "LLM"): string {
  return type === "HTTP"
    ? "bg-blue-500/10 text-blue-500 dark:text-blue-400"
    : "bg-primary/10 text-primary"
}

export function countSkillsByType(skills: SkillDefinition[]): { http: number; llm: number } {
  const http = skills.filter((s) => s.precompileType === "HTTP").length
  const llm = skills.filter((s) => s.precompileType === "LLM").length
  return { http, llm }
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SkillDefinition } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatRitual(wei: bigint | string): string {
  if (typeof wei === "string") wei = BigInt(wei)
  const amount = Number(wei) / 1e18
  // Always express in RITUAL with a precision appropriate to the magnitude — no Gwei,
  // which is confusing in a marketplace UI.
  if (amount >= 1000) return `${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} RITUAL`
  if (amount >= 1) return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} RITUAL`
  if (amount >= 0.001) return `${amount.toFixed(4)} RITUAL`
  if (amount > 0) return `${amount.toFixed(8)} RITUAL`
  return "0 RITUAL"
}

// Compact variant for tight UI (stat cards, badges) — drops the unit when very small.
export function formatRitualCompact(wei: bigint | string): string {
  if (typeof wei === "string") wei = BigInt(wei)
  const amount = Number(wei) / 1e18
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`
  if (amount >= 1) return amount.toFixed(1)
  if (amount >= 0.001) return amount.toFixed(3)
  return amount.toFixed(5)
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function formatBond(wei: bigint | string): string {
  return formatRitual(wei)
}

// HTTP/LLM colored separately — LLM uses the primary accent (teal), HTTP blue. Not AI-purple.
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

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
  if (amount >= 1000) return `${amount.toFixed(0)} RITUAL`
  if (amount >= 0.01) return `${amount.toFixed(4)} RITUAL`
  return `${(Number(wei) / 1e12).toFixed(2)} Gwei`
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function formatBond(wei: bigint | string): string {
  return formatRitual(wei)
}

// HTTP/LLM fungsional dipisah warna — LLM pakai accent primary (teal), HTTP blue. Bukan AI-purple.
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

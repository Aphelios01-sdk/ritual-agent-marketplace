import type { MetadataRoute } from "next"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ritual-agent-marketplace-xi.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/dashboard",
    "/jobs",
    "/work",
    "/activity",
    "/analytics",
    "/create",
    "/skills",
    "/docs",
    "/disputes",
    "/leaderboard",
    "/templates",
    "/bond",
    "/bulk",
    "/subscriptions",
    "/webhooks",
    "/subcontract",
    "/api-keys",
    "/layers",
    "/join",
    "/join/user",
    "/join/asp",
    "/join/evaluator",
  ]

  const now = new Date()
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/jobs" || path === "/dashboard" ? "hourly" : "daily",
    priority: path === "/" ? 1 : path === "/jobs" || path === "/dashboard" ? 0.9 : 0.6,
  }))
}

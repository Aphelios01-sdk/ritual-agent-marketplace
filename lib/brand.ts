/** Ritual brand kit assets + builder links (community kit + Ritual Tools). */

export const RITUAL_COLORS = {
  green: "#00ff99",
  greenDim: "rgba(0, 255, 153, 0.12)",
  greenBorder: "rgba(0, 255, 153, 0.22)",
  dark: "#020617",
  black: "#0a0a0a",
  lime: "#a3e635",
  red: "#ef4444",
  cyan: "#00c3ff",
} as const

export const BRAND_LOGOS = [
  {
    id: "logo-white",
    name: "Logo · White",
    note: "For dark backgrounds",
    src: "/brand/logo-white.png",
    bg: "dark" as const,
  },
  {
    id: "logo-black",
    name: "Logo · Black",
    note: "For light backgrounds",
    src: "/brand/logo-black.png",
    bg: "light" as const,
  },
  {
    id: "logo-red",
    name: "Logo · Red",
    note: "Black text on red",
    src: "/brand/logo-red.jpg",
    bg: "red" as const,
  },
  {
    id: "logo-lime",
    name: "Logo · Lime",
    note: "Black text on lime",
    src: "/brand/logo-lime.jpg",
    bg: "lime" as const,
  },
  {
    id: "logo-gradient",
    name: "Logo · Gradient",
    note: "White on green gradient",
    src: "/brand/logo-gradient.jpg",
    bg: "gradient" as const,
  },
  {
    id: "symbol",
    name: "Symbol",
    note: "Main mark",
    src: "/brand/symbol.jpg",
    bg: "dark" as const,
  },
  {
    id: "symbol-variant",
    name: "Symbol variant",
    note: "White on black",
    src: "/brand/symbol-variant.png",
    bg: "dark" as const,
  },
] as const

export const BRAND_SIGGY = [
  { id: "siggy-01", name: "Siggy 01", src: "/brand/siggy-01.png" },
  { id: "siggy-02", name: "Siggy 02", src: "/brand/siggy-02.png" },
  { id: "siggy-03", name: "Siggy 03", src: "/brand/siggy-03.png" },
  { id: "siggy-04", name: "Siggy 04", src: "/brand/siggy-04.png" },
] as const

export const BUILDER_LINKS = [
  {
    title: "Ritual Tools",
    desc: "Curated entry point — docs, examples, community.",
    href: "https://links.ritual.tools",
  },
  {
    title: "Documentation",
    desc: "Guides, precompiles, agent architecture.",
    href: "https://docs.ritual.net/",
  },
  {
    title: "GitHub",
    desc: "Open source, starters, and examples.",
    href: "https://github.com/RitualChain",
  },
  {
    title: "Discord",
    desc: "Builders community + office hours.",
    href: "https://discord.gg/8hcc3EAZt8",
  },
  {
    title: "Feedback",
    desc: "Shape the roadmap with feature votes.",
    href: "https://feedback.ritual.tools/",
  },
  {
    title: "Telegram",
    desc: "Updates and community chat.",
    href: "https://t.me/RitualChain",
  },
] as const

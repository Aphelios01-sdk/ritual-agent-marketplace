/**
 * Agent profile photo helpers.
 * On chain source of truth: AgentDirectory.metadataURI
 * (JSON {"image":"..."} or bare image URL).
 * Local overlay (localStorage) for draft / immediate preview.
 */

export interface AgentMetadata {
  image?: string
  avatar?: string
  name?: string
  description?: string
  bio?: string
  [key: string]: unknown
}

const LOCAL_AVATAR_KEY = "pm_agent_avatars"
const MAX_ONCHAIN_URI_LEN = 2_400
const MAX_UPLOAD_EDGE = 256
const MAX_UPLOAD_BYTES = 180_000

/** Extract image URL from metadataURI (JSON or bare URL / data URI). */
export function parseAvatarFromMetadataURI(uri: string | undefined | null): string | undefined {
  if (!uri) return undefined
  const t = uri.trim()
  if (!t) return undefined
  if (isImageSrc(t)) return t
  try {
    const obj = JSON.parse(t) as AgentMetadata
    const img = (obj.image || obj.avatar || "").toString().trim()
    return img && isImageSrc(img) ? img : undefined
  } catch {
    // ipfs://CID or gateway path without image extension. Treat as resource URL
    if (t.startsWith("ipfs://") || t.startsWith("ar://")) return t
    return undefined
  }
}

export function isImageSrc(s: string): boolean {
  return (
    s.startsWith("https://") ||
    s.startsWith("http://") ||
    s.startsWith("data:image/") ||
    s.startsWith("blob:") ||
    s.startsWith("ipfs://") ||
    s.startsWith("ar://")
  )
}

/** Build metadataURI string for setProfile. Prefer JSON when bio/name present. */
export function encodeMetadataURI(opts: {
  image?: string
  bio?: string
  name?: string
  description?: string
  existing?: string
}): string {
  let base: AgentMetadata = {}
  if (opts.existing) {
    try {
      base = JSON.parse(opts.existing) as AgentMetadata
    } catch {
      const existingImg = parseAvatarFromMetadataURI(opts.existing)
      if (existingImg) base.image = existingImg
    }
  }
  if (opts.image !== undefined) {
    if (opts.image) base.image = opts.image
    else {
      delete base.image
      delete base.avatar
    }
  }
  if (opts.bio !== undefined) base.bio = opts.bio
  if (opts.name !== undefined) base.name = opts.name
  if (opts.description !== undefined) base.description = opts.description

  const keys = Object.keys(base).filter((k) => base[k] !== undefined && base[k] !== "")
  if (keys.length === 0) return ""
  // Single image field → can store bare URL (cheaper gas)
  if (keys.length === 1 && (keys[0] === "image" || keys[0] === "avatar") && typeof base[keys[0]] === "string") {
    return String(base[keys[0]])
  }
  return JSON.stringify(base)
}

export function isUriTooLargeForChain(uri: string): boolean {
  return uri.length > MAX_ONCHAIN_URI_LEN
}

// ── Local storage overlay (draft / preview) ─────────────────

type LocalMap = Record<string, string>

function readLocalMap(): LocalMap {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AVATAR_KEY) || "{}") as LocalMap
  } catch {
    return {}
  }
}

function writeLocalMap(map: LocalMap) {
  if (typeof window === "undefined") return
  localStorage.setItem(LOCAL_AVATAR_KEY, JSON.stringify(map))
}

/** Key by contract address (lowercased) and/or agent id. */
export function getLocalAvatar(key: string | undefined | null): string | undefined {
  if (!key) return undefined
  const map = readLocalMap()
  return map[key.toLowerCase()] || map[key] || undefined
}

export function setLocalAvatar(key: string, imageUrl: string | null) {
  const map = readLocalMap()
  const k = key.toLowerCase()
  if (!imageUrl) delete map[k]
  else map[k] = imageUrl
  writeLocalMap(map)
}

/** Resolve best available avatar: local override > on chain. */
export function resolveAvatar(
  agent: { id: string; contractAddress?: string; avatarUrl?: string },
): string | undefined {
  const local =
    getLocalAvatar(agent.contractAddress) ||
    getLocalAvatar(agent.id)
  return local || agent.avatarUrl || undefined
}

// ── Client-side image compress (file → data URL) ────────────

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image (PNG, JPEG, WebP, GIF)")
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image too large (max 8 MB before compress)")
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas unavailable")
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  // Prefer JPEG for photos; keep PNG for transparency if source is PNG and small.
  let quality = 0.85
  let dataUrl = canvas.toDataURL("image/jpeg", quality)
  while (dataUrl.length > MAX_UPLOAD_BYTES && quality > 0.4) {
    quality -= 0.1
    dataUrl = canvas.toDataURL("image/jpeg", quality)
  }
  if (dataUrl.length > MAX_UPLOAD_BYTES) {
    throw new Error("Could not compress image under size limit. Use a smaller file or an image URL")
  }
  return dataUrl
}

/** Normalize ipfs:// to a public gateway URL for <img src>. */
export function toDisplayableImageUrl(src: string): string {
  if (src.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${src.slice("ipfs://".length)}`
  }
  if (src.startsWith("ar://")) {
    return `https://arweave.net/${src.slice("ar://".length)}`
  }
  return src
}

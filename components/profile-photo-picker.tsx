"use client"

import { useRef, useState } from "react"
import { Camera, Link2, Trash2, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, errMessage } from "@/lib/utils"
import {
  fileToAvatarDataUrl,
  isImageSrc,
  toDisplayableImageUrl,
} from "@/lib/agent-profile"

interface ProfilePhotoPickerProps {
  value: string
  onChange: (url: string) => void
  name?: string
  className?: string
  /** Compact layout for tight forms */
  compact?: boolean
}

/**
 * Pick agent profile photo via image URL or file upload (compressed data URL).
 */
export function ProfilePhotoPicker({
  value,
  onChange,
  name = "Agent",
  className,
  compact,
}: ProfilePhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [broken, setBroken] = useState(false)

  const applyUrl = () => {
    setError(null)
    const t = urlDraft.trim()
    if (!t) {
      setError("Paste an image URL first")
      return
    }
    if (!isImageSrc(t)) {
      setError("URL must start with https://, http://, ipfs://, or data:image/")
      return
    }
    onChange(t)
    setBroken(false)
    setUrlDraft("")
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      onChange(dataUrl)
      setBroken(false)
    } catch (e) {
      setError(errMessage(e) || "Upload failed")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const clear = () => {
    onChange("")
    setBroken(false)
    setError(null)
  }

  const letter = name.charAt(0).toUpperCase() || "?"
  const showImg = Boolean(value) && !broken

  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn("flex gap-4", compact ? "items-center" : "items-start")}>
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-primary/10 font-mono font-bold text-primary",
              compact ? "h-16 w-16 text-lg" : "h-20 w-20 text-2xl",
            )}
          >
            {showImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={toDisplayableImageUrl(value)}
                alt="Profile preview"
                className="h-full w-full object-cover"
                onError={() => setBroken(true)}
              />
            ) : (
              <span>{letter}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:border-primary/50 hover:bg-primary/10"
            title="Upload photo"
            aria-label="Upload profile photo"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">
            Upload an image or paste a public URL (HTTPS / IPFS). Shown on marketplace cards and agent profile.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {busy ? "Compressing…" : "Upload"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clear}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                applyUrl()
              }
            }}
            placeholder="https://… or ipfs://…"
            className="w-full rounded-lg border border-border bg-transparent py-2 pl-8 pr-3 text-sm outline-none ring-ring focus-visible:ring-2"
          />
        </div>
        <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={applyUrl}>
          Use URL
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {broken && value && (
        <p className="text-xs text-chart-3">Could not load this image — check the URL or upload a file instead.</p>
      )}
    </div>
  )
}

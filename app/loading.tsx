export default function Loading() {
  return (
    <div className="flex min-h-[40dvh] items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 rounded-full border-2 border-[#00ff99]/25 border-t-[#00ff99] animate-spin"
          aria-hidden
        />
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    </div>
  )
}

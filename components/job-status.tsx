"use client"

import { cn } from "@/lib/utils"
import { JOB_STATUS_COLORS } from "@/lib/constants"
import type { JobStatus } from "@/lib/constants"

interface JobStatusBadgeProps {
  status: JobStatus
  className?: string
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", JOB_STATUS_COLORS[status], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current")} />
      {status.replace("_", " ")}
    </span>
  )
}

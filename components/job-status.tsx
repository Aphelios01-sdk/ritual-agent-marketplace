"use client"

import { cn } from "@/lib/utils"
import { JOB_STATUS_COLORS } from "@/lib/constants"
import type { JobStatus } from "@/lib/constants"

interface JobStatusBadgeProps {
  status: JobStatus
  /** When true, overrides status with an Expired badge (OPEN past deadline). */
  expired?: boolean
  className?: string
}

export function JobStatusBadge({ status, expired, className }: JobStatusBadgeProps) {
  if (expired) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium text-red-400", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        Expired
      </span>
    )
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", JOB_STATUS_COLORS[status], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current")} />
      {status.replace("_", " ")}
    </span>
  )
}

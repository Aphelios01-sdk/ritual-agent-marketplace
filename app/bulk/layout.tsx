import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bulk Jobs",
  description: "Submit many tasks at once via BulkJobBatcher with prepaid RIT escrow.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

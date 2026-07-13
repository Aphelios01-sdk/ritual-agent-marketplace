"use client"

import { McpActionPanel } from "@/components/mcp-action-panel"

/** Install guide redirected to MCP tools. */
export function SkillInstallGuide() {
  return (
    <McpActionPanel
      surface="skills"
      title="Install skills via MCP"
      description="Use pm_skill_catalog then pm_set_skills / pm_integrate. No wallet UI."
    />
  )
}

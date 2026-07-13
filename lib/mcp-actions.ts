/**
 * Map of website surfaces → MCP tools / example prompts.
 * All on-chain writes go through MCP only.
 */

export type McpToolRef = {
  name: string
  role?: "user" | "asp" | "evaluator" | "any"
  desc: string
  example: string
}

export const MCP_TOOLS_BY_SURFACE: Record<string, McpToolRef[]> = {
  jobs: [
    {
      name: "pm_post_job",
      role: "user",
      desc: "Post task with escrowed reward",
      example: `pm_post_job task="Analyze BTC sentiment last 24h" reward="0.1" skill_ids=["0x0000000000000000000000000000000000000000000000000000000000000001"]`,
    },
    {
      name: "pm_list_jobs",
      role: "any",
      desc: "List jobs by status",
      example: `pm_list_jobs status=OPEN limit=20`,
    },
    {
      name: "pm_submit_bid",
      role: "asp",
      desc: "Bid on open job",
      example: `pm_submit_bid job_id="1" price="0.01" est_blocks=100`,
    },
  ],
  "job-detail": [
    {
      name: "pm_list_bids",
      role: "user",
      desc: "List bids before assign",
      example: `pm_list_bids job_id="JOB_ID"`,
    },
    {
      name: "pm_assign_job",
      role: "user",
      desc: "Assign winning bid",
      example: `pm_assign_job job_id="JOB_ID" bid_index=0`,
    },
    {
      name: "pm_submit_bid",
      role: "asp",
      desc: "Submit bid",
      example: `pm_submit_bid job_id="JOB_ID" price="0.01" est_blocks=100`,
    },
    {
      name: "pm_start_processing",
      role: "asp",
      desc: "Start job + bond",
      example: `pm_start_processing job_id="JOB_ID" bond="0.05"`,
    },
    {
      name: "pm_submit_result",
      role: "asp",
      desc: "Deliver result",
      example: `pm_submit_result job_id="JOB_ID" result='{"ok":true}'`,
    },
    {
      name: "pm_rate",
      role: "user",
      desc: "Rate provider 1 to-5",
      example: `pm_rate job_id="JOB_ID" rating=5`,
    },
    {
      name: "pm_dispute_job",
      role: "user",
      desc: "Open dispute",
      example: `pm_dispute_job job_id="JOB_ID"`,
    },
  ],
  bond: [
    {
      name: "pm_stake",
      role: "asp",
      desc: "Stake bond",
      example: `pm_stake amount="0.1"`,
    },
    {
      name: "pm_heartbeat",
      role: "asp",
      desc: "Liveness ping",
      example: `pm_heartbeat`,
    },
    {
      name: "pm_status",
      role: "any",
      desc: "Balance + stake status",
      example: `pm_status`,
    },
  ],
  create: [
    {
      name: "pm_integrate",
      role: "asp",
      desc: "Register + skills + stake + heartbeat",
      example: `pm_integrate name="My Agent" description="HTTP+LLM provider" stake_amount="0.1"`,
    },
    {
      name: "pm_set_profile",
      role: "asp",
      desc: "Profile photo metadataURI",
      example: `pm_set_profile metadata_uri="https://example.com/avatar.png"`,
    },
  ],
  disputes: [
    {
      name: "pm_stake_verifier",
      role: "evaluator",
      desc: "Stake as dispute verifier",
      example: `pm_stake_verifier amount="0.1"`,
    },
    {
      name: "pm_list_disputes",
      role: "evaluator",
      desc: "List disputes",
      example: `pm_list_disputes limit=20`,
    },
    {
      name: "pm_vote_dispute",
      role: "evaluator",
      desc: "Vote requester or provider",
      example: `pm_vote_dispute dispute_id="1" favor=provider`,
    },
  ],
  bulk: [
    {
      name: "pm_post_job",
      role: "user",
      desc: "Post each task (repeat via agent loop)",
      example: `pm_post_job task="task A" reward="0.05"\npm_post_job task="task B" reward="0.05"`,
    },
  ],
  subscriptions: [
    {
      name: "pm_status",
      role: "any",
      desc: "Check agent readiness",
      example: `pm_list_agents limit=10`,
    },
  ],
  webhooks: [
    {
      name: "pm_status",
      role: "asp",
      desc: "Webhook registration via MCP env + custom tooling",
      example: `pm_status  # then configure webhook off chain / future pm_register_webhook`,
    },
  ],
  templates: [
    {
      name: "pm_post_job",
      role: "user",
      desc: "Instantiate template as job via MCP",
      example: `pm_post_job task="[template] DeFi weekly report" reward="0.1" skill_ids=["0x0000000000000000000000000000000000000000000000000000000000000003"]`,
    },
  ],
  subcontract: [
    {
      name: "pm_post_job",
      role: "asp",
      desc: "Delegate sub work as a new job via MCP",
      example: `pm_post_job task="Subtask for parent job #N" reward="0.02"`,
    },
  ],
  skills: [
    {
      name: "pm_skill_catalog",
      role: "any",
      desc: "List skill IDs",
      example: `pm_skill_catalog`,
    },
    {
      name: "pm_set_skills",
      role: "asp",
      desc: "Install skills on agent",
      example: `pm_set_skills skill_ids=["0x0000000000000000000000000000000000000000000000000000000000000001","0x0000000000000000000000000000000000000000000000000000000000000002"]`,
    },
  ],
  avatar: [
    {
      name: "pm_set_profile",
      role: "asp",
      desc: "Set avatar / metadataURI",
      example: `pm_set_profile metadata_uri="https://…/photo.png"`,
    },
  ],
  agents: [
    {
      name: "pm_list_agents",
      role: "any",
      desc: "List registry",
      example: `pm_list_agents limit=20`,
    },
    {
      name: "pm_get_agent",
      role: "any",
      desc: "Agent detail + skills",
      example: `pm_get_agent agent_id="1"`,
    },
  ],
}

export function fillJobId(example: string, jobId: string): string {
  return example.replaceAll("JOB_ID", jobId)
}

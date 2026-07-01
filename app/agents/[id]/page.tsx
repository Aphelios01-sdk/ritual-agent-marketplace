import Link from "next/link"
import { ArrowLeft, Star, Shield, Cpu, Wifi, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MOCK_AGENTS,
  MOCK_JOB_REQUESTS,
  JOB_STATUS_LABELS,
  type AgentInfo,
} from "@/lib/constants"
import { fetchAgents } from "@/lib/onchain"
import { formatRitual, formatRating, truncateAddress, getSkillBadgeColor } from "@/lib/utils"

export const dynamic = "force-dynamic"

function countSkillTypes(skills: AgentInfo["skills"]) {
  return skills.reduce(
    (acc, s) => {
      if (s.precompileType === "HTTP") acc.http++
      else acc.llm++
      return acc
    },
    { http: 0, llm: 0 }
  )
}

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Cari di on-chain dulu, fallback mock
  let agent: AgentInfo | undefined
  try {
    const onchain = await fetchAgents()
    agent = onchain.find((a) => a.id === id)
  } catch {
    /* ignore */
  }
  if (!agent) agent = MOCK_AGENTS.find((a) => a.id === id)

  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Agent not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/">Back to Network</Link>
        </Button>
      </div>
    )
  }

  const skillCounts = countSkillTypes(agent.skills)
  const incoming = MOCK_JOB_REQUESTS.filter((j) => j.status === "OPEN")
  const active = MOCK_JOB_REQUESTS.filter((j) => j.status === "IN_PROGRESS" || j.status === "ASSIGNED")
  const completed = MOCK_JOB_REQUESTS.filter((j) => j.status === "COMPLETED")

  return (
    <div className="container mx-auto max-w-[1400px] px-4 py-8 md:py-12">
      <Button variant="ghost" size="sm" className="mb-4 gap-2" asChild>
        <Link href="/"><ArrowLeft className="h-4 w-4" /> Back</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agent Profile */}
        <div className="lg:col-span-2">
          <Card className="surface-card border-border/60">
            <CardContent className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h1 className="mb-2 text-2xl font-bold">{agent.name}</h1>
                  <p className="text-muted-foreground">{agent.description}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="text-2xl font-bold">{agent.name.charAt(0)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mb-6 grid grid-cols-3 gap-4 border-y border-border py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-lg font-bold">{formatRating(agent.avgRating)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating ({agent.jobCount} jobs)</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{formatRitual(agent.bondAmount)}</p>
                  <p className="text-xs text-muted-foreground">Bond</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{formatRitual(agent.totalEarnings)}</p>
                  <p className="text-xs text-muted-foreground">Total earned</p>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Installed Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {agent.skills.map((skill) => (
                    <Badge
                      key={skill.skillId}
                      className={`${getSkillBadgeColor(skill.precompileType)} gap-1`}
                    >
                      <Cpu className="h-3 w-3" />
                      {skill.name}
                    </Badge>
                  ))}
                  {agent.skills.length === 0 && (
                    <p className="text-xs text-muted-foreground">No skills installed</p>
                  )}
                </div>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span>{skillCounts.http} HTTP skill(s)</span>
                  <span>{skillCounts.llm} LLM skill(s)</span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Contract:</span>
                  <span className="font-mono text-xs">{truncateAddress(agent.contractAddress)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span>Status:</span>
                  <Badge variant="default" className="text-[10px]">
                    {agent.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity sidebar */}
        <div className="space-y-4">
          {/* Incoming Jobs */}
          <Card className="surface-card border-border/60">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <h3 className="font-semibold">Incoming Requests</h3>
                <span className="ml-auto text-xs text-muted-foreground">{incoming.length}</span>
              </div>
              {incoming.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {incoming.map((job) => (
                    <div key={job.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium">Job #{job.id}</span>
                        <Badge variant="secondary" className="text-[10px]">REQUESTED</Badge>
                      </div>
                      <p className="mb-1 text-xs text-muted-foreground">{job.taskData}</p>
                      <p className="text-xs font-medium text-primary">{formatRitual(job.reward)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Jobs */}
          <Card className="surface-card border-border/60">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold">Active Jobs</h3>
                <span className="ml-auto text-xs text-muted-foreground">{active.length}</span>
              </div>
              {active.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No active jobs</p>
              ) : (
                <div className="space-y-2">
                  {active.map((job) => (
                    <div key={job.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium">Job #{job.id}</span>
                        <Badge variant="secondary" className="text-[10px]">{JOB_STATUS_LABELS[job.status]}</Badge>
                      </div>
                      <p className="mb-1 text-xs text-muted-foreground">{job.taskData}</p>
                      <p className="text-xs font-medium text-primary">{formatRitual(job.reward)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="surface-card border-border/60">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold">Completed</h3>
                <span className="ml-auto text-xs text-muted-foreground">{completed.length}</span>
              </div>
              {completed.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No completed jobs</p>
              ) : (
                <div className="space-y-2">
                  {completed.map((job) => (
                    <div key={job.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium">Job #{job.id}</span>
                        <Badge variant="secondary" className="text-[10px]">{JOB_STATUS_LABELS[job.status]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{job.taskData}</p>
                      {job.rating > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs">{job.rating}/5</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

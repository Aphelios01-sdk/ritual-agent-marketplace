export type Locale = "en" | "id" | "zh" | "ko"

export const LOCALES: { id: Locale; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "id", label: "Indonesia", short: "ID" },
  { id: "zh", label: "中文", short: "中文" },
  { id: "ko", label: "한국어", short: "한" },
]

export const DEFAULT_LOCALE: Locale = "en"
export const LOCALE_STORAGE_KEY = "pm_locale"

export type Messages = {
  nav: {
    tasks: string
    dashboard: string
    mcp: string
    roles: string
    docs: string
    tutorial: string
    skills: string
    bond: string
    analytics: string
    leaderboard: string
    activity: string
    disputes: string
    mcpSetup: string
    menu: string
  }
  footer: {
    docs: string
    tutorial: string
    integrate: string
    tasks: string
    skills: string
    chain: string
  }
  landing: {
    eyebrow: string
    title: string
    body: string
    ctaMcp: string
    ctaTasks: string
    ctaTutorial: string
    live: string
    offline: string
    agents: string
    tasks: string
    open: string
    done: string
    agentsTitle: string
    agentsSub: string
    allAgents: string
    startTitle: string
    integrateTitle: string
    integrateBody: string
    tasksTitle: string
    tasksBody: string
    tutorialTitle: string
    tutorialBody: string
    leaderboard: string
    readyTitle: string
    readyBody: string
    dashboard: string
    noAgents: string
    createOne: string
    jobs: string
    view: string
    rating: string
  }
  join: {
    badge: string
    title: string
    body: string
    mcpSetup: string
    tutorial: string
    user: string
    userSub: string
    userBody: string
    asp: string
    aspSub: string
    aspBody: string
    evaluator: string
    evaluatorSub: string
    evaluatorBody: string
    path: string
    note: string
    docs: string
    mcpPath: string
    setup: string
    agentPrompt: string
    userTitle: string
    userDesc: string
    aspTitle: string
    aspDesc: string
    evalTitle: string
    evalDesc: string
  }
  common: {
    back: string
    copy: string
    copied: string
    loading: string
    language: string
    refresh: string
    live: string
    offline: string
    market: string
  }
  mcp: {
    badge: string
    only: string
    setup: string
    actionsTitle: string
    actionsBody: string
    integrateTitle: string
    integrateBody: string
    clientConfig: string
    tools: string
    examplePrompt: string
    pathsKey: string
    repoPath: string
    keyPlaceholder: string
    install: string
    hermesHint: string
    openclawHint: string
    ritualHint: string
    checklist: string
    checklistFund: string
    checklistIntegrate: string
    checklistProfile: string
    checklistLoop: string
    writeKeyNote: string
    jobTools: string
    copyMcp: string
    copiedMcp: string
    postJobTitle: string
    postJobHint: string
    requiredSkill: string
    promptTask: string
    rewardRitual: string
    taskPlaceholder: string
    taskDefault: string
  }
  jobs: {
    title: string
    eyebrow: string
    body: string
    postAsUser: string
    bidAsAsp: string
    openForBids: string
    inFlight: string
    completed: string
    quiet: string
    quietBody: string
    scrollPost: string
    postMcp: string
    available: string
    active: string
    done: string
    all: string
    empty: string
    emptyHint: string
    emptyTab: string
    reward: string
    bond: string
    requester: string
    provider: string
    unassigned: string
    task: string
    lifecycle: string
    bids: string
    noBids: string
    result: string
    jobActions: string
    jobActionsBody: string
  }
  bondPage: {
    eyebrow: string
    title: string
    body: string
    toolsTitle: string
  }
  createPage: {
    eyebrow: string
    title: string
    body: string
    toolsTitle: string
    fullConfig: string
  }
  agent: {
    rating: string
    bond: string
    earned: string
  }
  rolesSection: {
    badge: string
    title: string
    body: string
    userTitle: string
    aspTitle: string
    evalTitle: string
    mcpSetup: string
  }
  dashboard: {
    agents: string
    jobs: string
    skills: string
    jobsByStatus: string
  }
}

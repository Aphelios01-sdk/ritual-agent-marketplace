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
  }
  common: {
    back: string
    copy: string
    copied: string
    loading: string
    language: string
  }
  mcp: {
    badge: string
    only: string
    setup: string
    actionsTitle: string
    actionsBody: string
  }
  jobs: {
    title: string
    postMcp: string
    available: string
    active: string
    done: string
    all: string
    empty: string
    emptyHint: string
    reward: string
  }
}

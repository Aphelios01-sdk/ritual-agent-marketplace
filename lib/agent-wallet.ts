/**
 * Agent-native wallet — local signing, no window.ethereum, no server relay.
 * Private key generated once, stored in localStorage.
 */
"use client"

import {
  createWalletClient,
  createPublicClient,
  http,
  type Address,
  type Hash,
  type WalletClient,
  type PublicClient,
  encodeFunctionData,
  keccak256,
  toBytes,
  stringToHex,
  type Hex,
} from "viem"
import { privateKeyToAccount, generatePrivateKey, type PrivateKeyAccount } from "viem/accounts"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "./constants"
import { JOB_MARKET_V2_ABI, AGENT_STAKING_ABI, AGENT_HEARTBEAT_ABI } from "./contract-abi-v2"
import { AGENT_REGISTRY_ABI } from "./contract-abi"
import { JOB_TEMPLATES_ABI, AGENT_REPUTATION_ABI, AGENT_DIRECTORY_ABI } from "./contract-abi-b"
import {
  DISPUTE_COUNCIL_ABI,
  SUBSCRIPTION_MANAGER_ABI,
  BULK_JOB_BATCHER_ABI,
  WEBHOOK_REGISTRY_ABI,
  AGENT_SUBCONTRACTOR_ABI,
} from "./contract-abi-c"

const JOB_MARKET = CONTRACT_ADDRESSES.jobMarketV2 as Address
const REGISTRY = CONTRACT_ADDRESSES.agentRegistry as Address
const STAKING = CONTRACT_ADDRESSES.agentStaking as Address
const HEARTBEAT = CONTRACT_ADDRESSES.agentHeartbeat as Address
const TEMPLATES = CONTRACT_ADDRESSES.jobTemplates as Address
const DISPUTE = CONTRACT_ADDRESSES.disputeCouncil as Address
const SUBS = CONTRACT_ADDRESSES.subscriptionManager as Address
const BULK = CONTRACT_ADDRESSES.bulkJobBatcher as Address
const WEBHOOKS = CONTRACT_ADDRESSES.webhookRegistry as Address
const SUBCON = CONTRACT_ADDRESSES.agentSubcontractor as Address
const REPUTATION = CONTRACT_ADDRESSES.agentReputation as Address
const DIRECTORY = CONTRACT_ADDRESSES.agentDirectory as Address

const PK_KEY = "agent_pk"
const API_KEYS_KEY = "pm_api_keys"

export interface AgentWallet {
  address: Address
  client: WalletClient
  account: PrivateKeyAccount
  privateKey: `0x${string}`
}

function makeWallet(pk: `0x${string}`): AgentWallet {
  const account = privateKeyToAccount(pk)
  const client = createWalletClient({
    account,
    chain: RITUAL_CHAIN,
    transport: http(RITUAL_CHAIN.rpcUrls.default.http[0]),
  })
  return { address: account.address, client, account, privateKey: pk }
}

export function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: RITUAL_CHAIN,
    transport: http(RITUAL_CHAIN.rpcUrls.default.http[0]),
  })
}

export function getAgentWallet(): AgentWallet {
  if (typeof window === "undefined") {
    throw new Error("getAgentWallet() must be called in the browser")
  }

  let pk = localStorage.getItem(PK_KEY) as `0x${string}` | null
  if (!pk || !pk.startsWith("0x") || pk.length !== 66) {
    pk = generatePrivateKey()
    localStorage.setItem(PK_KEY, pk)
  }

  return makeWallet(pk)
}

export function importAgentWallet(pk: `0x${string}`): AgentWallet {
  if (!pk.startsWith("0x") || pk.length !== 66) throw new Error("Invalid private key format")
  localStorage.setItem(PK_KEY, pk)
  return makeWallet(pk)
}

export function exportPrivateKey(): `0x${string}` | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(PK_KEY) as `0x${string}` | null
}

export function clearAgentWallet() {
  if (typeof window !== "undefined") localStorage.removeItem(PK_KEY)
}

export function toBytesUtf8(text: string): Hex {
  return stringToHex(text)
}

export async function getBalance(address: Address): Promise<bigint> {
  return getPublicClient().getBalance({ address })
}

export async function waitTx(hash: Hash) {
  return getPublicClient().waitForTransactionReceipt({ hash, timeout: 60_000 })
}

// ── Job market ──────────────────────────────────────────────

export async function postJob(
  wallet: AgentWallet,
  skillIds: `0x${string}`[],
  taskData: string,
  rewardWei: bigint,
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "requestService",
    args: [skillIds, toBytesUtf8(taskData)],
    value: rewardWei,
    chain: RITUAL_CHAIN,
  })
}

export async function submitBid(
  wallet: AgentWallet,
  jobId: bigint,
  priceWei: bigint,
  estBlocks: bigint = BigInt(100),
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "submitBid",
    args: [jobId, priceWei, estBlocks],
    chain: RITUAL_CHAIN,
  })
}

export async function startProcessing(
  wallet: AgentWallet,
  jobId: bigint,
  bondWei: bigint,
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "startProcessing",
    args: [jobId],
    value: bondWei,
    chain: RITUAL_CHAIN,
  })
}

export async function assignJob(
  wallet: AgentWallet,
  jobId: bigint,
  bidIndex: bigint,
  topUpWei: bigint = BigInt(0),
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "assignJob",
    args: [jobId, bidIndex],
    value: topUpWei,
    chain: RITUAL_CHAIN,
  })
}

export async function submitResult(
  wallet: AgentWallet,
  jobId: bigint,
  resultData: string,
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "submitResult",
    args: [jobId, toBytesUtf8(resultData)],
    chain: RITUAL_CHAIN,
  })
}

export async function rateProvider(
  wallet: AgentWallet,
  jobId: bigint,
  rating: bigint,
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "rateProvider",
    args: [jobId, rating],
    chain: RITUAL_CHAIN,
  })
}

export async function disputeJob(wallet: AgentWallet, jobId: bigint): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "dispute",
    args: [jobId],
    chain: RITUAL_CHAIN,
  })
}

export async function claimTimeout(wallet: AgentWallet, jobId: bigint): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "claimTimeout",
    args: [jobId],
    chain: RITUAL_CHAIN,
  })
}

// ── Registry / staking / heartbeat ──────────────────────────

export async function registerAgent(
  wallet: AgentWallet,
  name: string,
  description: string,
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: "registerAgent",
    args: [name, description, wallet.address],
    chain: RITUAL_CHAIN,
  })
}

export async function stakeBond(wallet: AgentWallet, amountWei: bigint): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: STAKING,
    abi: AGENT_STAKING_ABI,
    functionName: "stake",
    args: [],
    value: amountWei,
    chain: RITUAL_CHAIN,
  })
}

export async function requestUnstake(wallet: AgentWallet): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: STAKING,
    abi: AGENT_STAKING_ABI,
    functionName: "requestUnstake",
    args: [],
    chain: RITUAL_CHAIN,
  })
}

export async function readStake(agent: Address): Promise<{
  amount: bigint
  lockedUntil: bigint
  strikes: bigint
  active: boolean
} | null> {
  try {
    const r = (await getPublicClient().readContract({
      address: STAKING,
      abi: AGENT_STAKING_ABI,
      functionName: "getStake",
      args: [agent],
    })) as readonly [bigint, bigint, bigint, boolean]
    return { amount: r[0], lockedUntil: r[1], strikes: r[2], active: r[3] }
  } catch {
    return null
  }
}

export async function pingHeartbeat(wallet: AgentWallet): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: HEARTBEAT,
    abi: AGENT_HEARTBEAT_ABI,
    functionName: "ping",
    args: [],
    chain: RITUAL_CHAIN,
  })
}

export async function readReputation(agent: Address): Promise<{
  score: bigint
  reviewCount: bigint
  lastUpdate: bigint
} | null> {
  try {
    const r = (await getPublicClient().readContract({
      address: REPUTATION,
      abi: AGENT_REPUTATION_ABI,
      functionName: "getReputation",
      args: [agent],
    })) as readonly [bigint, bigint, bigint]
    return { score: r[0], reviewCount: r[1], lastUpdate: r[2] }
  } catch {
    return null
  }
}

/**
 * Update agent profile on AgentDirectory (category, tags, metadataURI).
 * Caller must be a registered agent (msg.sender = agent contract address).
 * metadataURI typically holds JSON `{"image":"https://..."}` or a bare image URL.
 */
export async function setAgentProfile(
  wallet: AgentWallet,
  category: `0x${string}`,
  tags: readonly `0x${string}`[],
  metadataURI: string,
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: DIRECTORY,
    abi: AGENT_DIRECTORY_ABI,
    functionName: "setProfile",
    args: [category, [...tags], metadataURI],
    chain: RITUAL_CHAIN,
  })
}

/** Convenience: set only the avatar image (category defaults to keccak256("general")). */
export async function setAgentAvatar(
  wallet: AgentWallet,
  imageUrl: string,
  existingMetadataURI?: string,
): Promise<Hash> {
  // Lazy import avoids circular deps with onchain consumers
  const { encodeMetadataURI } = await import("./agent-profile")
  const metadataURI = encodeMetadataURI({ image: imageUrl, existing: existingMetadataURI })
  const category = keccak256(toBytes("general")) as `0x${string}`
  return setAgentProfile(wallet, category, [], metadataURI)
}

// ── Templates ───────────────────────────────────────────────

export async function createTemplate(
  wallet: AgentWallet,
  name: string,
  skillIds: `0x${string}`[],
  taskData: string,
  defaultRewardWei: bigint,
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: TEMPLATES,
    abi: JOB_TEMPLATES_ABI,
    functionName: "createTemplate",
    args: [name, skillIds, toBytesUtf8(taskData), defaultRewardWei],
    chain: RITUAL_CHAIN,
  })
}

// ── Dispute council ─────────────────────────────────────────

export async function stakeAsVerifier(wallet: AgentWallet, amountWei: bigint): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: DISPUTE,
    abi: DISPUTE_COUNCIL_ABI,
    functionName: "stakeAsVerifier",
    args: [],
    value: amountWei,
    chain: RITUAL_CHAIN,
  })
}

/** v: 0 = favor requester, 1 = favor provider (per contract enum). */
export async function voteDispute(
  wallet: AgentWallet,
  disputeId: bigint,
  v: number,
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: DISPUTE,
    abi: DISPUTE_COUNCIL_ABI,
    functionName: "vote",
    args: [disputeId, v],
    chain: RITUAL_CHAIN,
  })
}

// ── Subscriptions ───────────────────────────────────────────

export async function subscribeToAgent(
  wallet: AgentWallet,
  agent: Address,
  skillIds: `0x${string}`[],
  taskTemplate: string,
  pricePerPeriod: bigint,
  periodBlocks: bigint,
  periods: bigint,
): Promise<Hash> {
  const total = pricePerPeriod * periods
  return wallet.client.writeContract({
    account: wallet.account,
    address: SUBS,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "subscribe",
    args: [agent, skillIds, toBytesUtf8(taskTemplate), pricePerPeriod, periodBlocks, periods],
    value: total,
    chain: RITUAL_CHAIN,
  })
}

// ── Bulk jobs ───────────────────────────────────────────────

export async function submitBatchJobs(
  wallet: AgentWallet,
  items: { skillIds: `0x${string}`[]; taskData: string; rewardWei: bigint }[],
): Promise<Hash> {
  const total = items.reduce((s, i) => s + i.rewardWei, BigInt(0))
  const packed = items.map((i) => ({
    requiredSkillIds: i.skillIds,
    taskData: toBytesUtf8(i.taskData),
    reward: i.rewardWei,
  }))
  return wallet.client.writeContract({
    account: wallet.account,
    address: BULK,
    abi: BULK_JOB_BATCHER_ABI,
    functionName: "submitBatch",
    args: [packed],
    value: total,
    chain: RITUAL_CHAIN,
  })
}

// ── Webhooks ────────────────────────────────────────────────

export async function registerWebhook(
  wallet: AgentWallet,
  target: Address,
  selector: `0x${string}`,
  eventTypes: `0x${string}`[],
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: WEBHOOKS,
    abi: WEBHOOK_REGISTRY_ABI,
    functionName: "registerWebhook",
    args: [target, selector, eventTypes],
    chain: RITUAL_CHAIN,
  })
}

export function eventTypeHash(label: string): `0x${string}` {
  return keccak256(toBytes(label))
}

// ── Subcontractor ───────────────────────────────────────────

export async function createSubcontract(
  wallet: AgentWallet,
  parentJobId: `0x${string}`,
  child: Address,
  skillIds: `0x${string}`[],
  taskData: string,
  rewardChild: bigint,
  parentReward: bigint,
  depth: number = 1,
): Promise<Hash> {
  return wallet.client.writeContract({
    account: wallet.account,
    address: SUBCON,
    abi: AGENT_SUBCONTRACTOR_ABI,
    functionName: "createSub",
    args: [parentJobId, child, skillIds, toBytesUtf8(taskData), rewardChild, parentReward, depth],
    value: rewardChild + parentReward,
    chain: RITUAL_CHAIN,
  })
}

// ── Local API keys (gateway auth tokens stored client-side) ─

export interface LocalApiKey {
  id: string
  name: string
  key: string
  createdAt: number
  lastUsedAt?: number
}

export function listApiKeys(): LocalApiKey[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(API_KEYS_KEY) || "[]") as LocalApiKey[]
  } catch {
    return []
  }
}

export function createApiKey(name: string): LocalApiKey {
  const keys = listApiKeys()
  const entry: LocalApiKey = {
    id: crypto.randomUUID(),
    name: name || "default",
    key: `pm_${crypto.randomUUID().replace(/-/g, "")}`,
    createdAt: Date.now(),
  }
  keys.push(entry)
  localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys))
  return entry
}

export function revokeApiKey(id: string) {
  const keys = listApiKeys().filter((k) => k.id !== id)
  localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys))
}

// re-export for convenience
export { stringToHex, encodeFunctionData }

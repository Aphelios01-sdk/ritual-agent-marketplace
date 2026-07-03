/**
 * Agent-native wallet — local signing, no window.ethereum, no server relay.
 * Private key generated once, stored in localStorage (or IndexedDB for production).
 * Agent pays gas from its own wallet, signs transactions directly.
 */
"use client"

import { createWalletClient, http, parseEther, formatEther, type Address } from "viem"
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "./constants"
import { JOB_MARKET_V2_ABI } from "./contract-abi-v2"
import { AGENT_REGISTRY_ABI } from "./contract-abi"

const JOB_MARKET = CONTRACT_ADDRESSES.jobMarketV2 as Address
const REGISTRY = CONTRACT_ADDRESSES.agentRegistry as Address
const PK_KEY = "agent_pk"

export interface AgentWallet {
  address: Address
  client: ReturnType<typeof createWalletClient>
  privateKey: `0x${string}`
}

/// Get or create the agent wallet. No popup, no MetaMask — pure local key.
export function getAgentWallet(): AgentWallet {
  if (typeof window === "undefined") {
    throw new Error("getAgentWallet() must be called in the browser")
  }

  let pk = localStorage.getItem(PK_KEY) as `0x${string}` | null
  if (!pk || !pk.startsWith("0x") || pk.length !== 66) {
    pk = generatePrivateKey()
    localStorage.setItem(PK_KEY, pk)
  }

  const account = privateKeyToAccount(pk)
  const client = createWalletClient({
    account,
    chain: RITUAL_CHAIN,
    transport: http(RITUAL_CHAIN.rpcUrls.default.http[0]),
  })

  return { address: account.address, client, privateKey: pk }
}

/// Import an existing private key (overwrite current).
export function importAgentWallet(pk: `0x${string}`): AgentWallet {
  if (!pk.startsWith("0x") || pk.length !== 66) throw new Error("Invalid private key format")
  localStorage.setItem(PK_KEY, pk)

  const account = privateKeyToAccount(pk)
  const client = createWalletClient({
    account,
    chain: RITUAL_CHAIN,
    transport: http(RITUAL_CHAIN.rpcUrls.default.http[0]),
  })

  return { address: account.address, client, privateKey: pk }
}

/// Export current private key (for backup).
export function exportPrivateKey(): `0x${string}` | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(PK_KEY) as `0x${string}` | null
}

/// Delete the stored key (wallet reset).
export function clearAgentWallet() {
  if (typeof window !== "undefined") localStorage.removeItem(PK_KEY)
}

/// Post a job on-chain. Agent signs + pays gas + reward from own wallet.
export async function postJob(
  wallet: AgentWallet,
  skillIds: `0x${string}`[],
  taskData: string,
  rewardWei: bigint,
): Promise<`0x${string}`> {
  const taskHex = ("0x" + Buffer.from(taskData, "utf8").toString("hex")) as `0x${string}`
  return wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "requestService",
    args: [skillIds, taskHex],
    value: rewardWei,
    chain: RITUAL_CHAIN,
  } as any)
}

/// Submit a bid on an open job.
export async function submitBid(
  wallet: AgentWallet,
  jobId: bigint,
  priceWei: bigint,
  estBlocks: bigint = BigInt(100),
): Promise<`0x${string}`> {
  return wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "submitBid",
    args: [jobId, priceWei, estBlocks],
    chain: RITUAL_CHAIN,
  } as any)
}

/// Start processing a job (provider posts bond).
export async function startProcessing(
  wallet: AgentWallet,
  jobId: bigint,
  bondWei: bigint,
): Promise<`0x${string}`> {
  return wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "startProcessing",
    args: [jobId],
    value: bondWei,
    chain: RITUAL_CHAIN,
  } as any)
}

/// Assign a job (requester picks a bid).
export async function assignJob(
  wallet: AgentWallet,
  jobId: bigint,
  bidIndex: bigint,
  topUpWei: bigint = BigInt(0),
): Promise<`0x${string}`> {
  return wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "assignJob",
    args: [jobId, bidIndex],
    value: topUpWei,
    chain: RITUAL_CHAIN,
  } as any)
}

/// Rate a provider after job completion.
export async function rateProvider(
  wallet: AgentWallet,
  jobId: bigint,
  rating: bigint,
): Promise<`0x${string}`> {
  return wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "rateProvider",
    args: [jobId, rating],
    chain: RITUAL_CHAIN,
  } as any)
}

/// Dispute a job.
export async function disputeJob(
  wallet: AgentWallet,
  jobId: bigint,
): Promise<`0x${string}`> {
  return wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "dispute",
    args: [jobId],
    chain: RITUAL_CHAIN,
  } as any)
}

/// Register an agent on-chain.
export async function registerAgent(
  wallet: AgentWallet,
  name: string,
  description: string,
): Promise<`0x${string}`> {
  return wallet.client.writeContract({
    address: REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: "registerAgent",
    args: [name, description, wallet.address],
    chain: RITUAL_CHAIN,
  } as any)
}

/**
 * Direct wallet connection via window.ethereum (EIP-1193).
 * No wagmi, no rainbowkit — raw viem + browser wallet.
 * Agent signs transactions directly, pays gas, requester = agent address.
 */
"use client"

import { createWalletClient, custom, type Address } from "viem"
import { RITUAL_CHAIN, CONTRACT_ADDRESSES } from "./constants"
import { JOB_MARKET_V2_ABI } from "./contract-abi-v2"
import { AGENT_REGISTRY_ABI } from "./contract-abi"

const JOB_MARKET = CONTRACT_ADDRESSES.jobMarketV2 as Address
const REGISTRY = CONTRACT_ADDRESSES.agentRegistry as Address

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on?: (event: string, cb: (...args: any[]) => void) => void
      removeListener?: (event: string, cb: (...args: any[]) => void) => void
    }
  }
}

export interface WalletState {
  address: Address
  client: ReturnType<typeof createWalletClient>
}

/// Request wallet connection. Returns address + walletClient.
export async function connectWallet(): Promise<WalletState> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No browser wallet found. Install MetaMask or another EVM wallet.")
  }

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
  if (!accounts?.length) throw new Error("No accounts returned from wallet.")

  const address = accounts[0] as Address
  const client = createWalletClient({
    account: address,
    chain: RITUAL_CHAIN,
    transport: custom(window.ethereum),
  })

  return { address, client }
}

/// Post a job on-chain: requestService(skillIds, taskData) with reward as msg.value.
export async function postJob(
  wallet: WalletState,
  skillIds: `0x${string}`[],
  taskData: string,
  rewardWei: bigint,
): Promise<`0x${string}`> {
  const taskHex = ("0x" + Buffer.from(taskData, "utf8").toString("hex")) as `0x${string}`

  const hash = await wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "requestService",
    args: [skillIds, taskHex],
    value: rewardWei,
    chain: RITUAL_CHAIN,
  } as any)

  return hash
}

/// Submit a bid on an open job.
export async function submitBid(
  wallet: WalletState,
  jobId: bigint,
  priceWei: bigint,
  estBlocks: bigint = BigInt(100),
): Promise<`0x${string}`> {
  const hash = await wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "submitBid",
    args: [jobId, priceWei, estBlocks],
    chain: RITUAL_CHAIN,
  } as any)

  return hash
}

/// Start processing a job (provider calls this, posts bond).
export async function startProcessing(
  wallet: WalletState,
  jobId: bigint,
  bondWei: bigint,
): Promise<`0x${string}`> {
  const hash = await wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "startProcessing",
    args: [jobId],
    value: bondWei,
    chain: RITUAL_CHAIN,
  } as any)

  return hash
}

/// Assign a job (requester calls this).
export async function assignJob(
  wallet: WalletState,
  jobId: bigint,
  bidIndex: bigint,
  topUpWei: bigint = BigInt(0),
): Promise<`0x${string}`> {
  const hash = await wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "assignJob",
    args: [jobId, bidIndex],
    value: topUpWei,
    chain: RITUAL_CHAIN,
  } as any)

  return hash
}

/// Rate a provider after job completion.
export async function rateProvider(
  wallet: WalletState,
  jobId: bigint,
  rating: bigint,
): Promise<`0x${string}`> {
  const hash = await wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "rateProvider",
    args: [jobId, rating],
    chain: RITUAL_CHAIN,
  } as any)

  return hash
}

/// Dispute a job.
export async function disputeJob(
  wallet: WalletState,
  jobId: bigint,
): Promise<`0x${string}`> {
  const hash = await wallet.client.writeContract({
    address: JOB_MARKET,
    abi: JOB_MARKET_V2_ABI,
    functionName: "dispute",
    args: [jobId],
    chain: RITUAL_CHAIN,
  } as any)

  return hash
}

/// Register an agent on-chain.
export async function registerAgent(
  wallet: WalletState,
  name: string,
  description: string,
): Promise<`0x${string}`> {
  const hash = await wallet.client.writeContract({
    address: REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: "registerAgent",
    args: [name, description, wallet.address],
    chain: RITUAL_CHAIN,
  } as any)

  return hash
}

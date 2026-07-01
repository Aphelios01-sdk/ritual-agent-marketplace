import { http, createConfig } from "wagmi"
import { injected } from "wagmi/connectors"
import type { Chain } from "wagmi/chains"
import { cookieStorage, createStorage } from "wagmi"

// Ritual testnet — EVM chain id 1979.
export const ritualChain: Chain = {
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ritualfoundation.org"] },
  },
  blockExplorers: {
    default: { name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org" },
  },
  testnet: true,
}

// Robust config for a custom testnet chain: injected-wallet only (no WalletConnect cloud
// dependency). Users connect via MetaMask/Rabby that has the Ritual network added.
export const config = createConfig({
  chains: [ritualChain],
  connectors: [injected({ shimDisconnect: true })],
  ssr: true,
  multiInjectedProviderDiscovery: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [ritualChain.id]: http("https://rpc.ritualfoundation.org"),
  },
})

export const wagmiChains = [ritualChain]

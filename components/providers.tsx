"use client"

import { useState } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RainbowKitProvider, darkTheme, type Theme } from "@rainbow-me/rainbowkit"
import { config } from "@/lib/wagmi"

// Custom dark theme tuned to the Prompt Market teal accent.
const rkTheme: Theme = darkTheme({
  accentColor: "#2dd4bf",
  accentColorForeground: "#0a0a0a",
  borderRadius: "medium",
  overlayBlur: "small",
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider theme={rkTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

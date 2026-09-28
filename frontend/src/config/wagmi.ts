// ─────────────────────────────────────────────────────────────────────────────
// Wagmi Configuration — WarrantyX
// ─────────────────────────────────────────────────────────────────────────────
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bohrTestnet, SUPPORTED_CHAINS } from './chains'

// ── Reown AppKit project ID ───────────────────────────────────────────────────
export const REOWN_PROJECT_ID: string =
  import.meta.env.VITE_REOWN_PROJECT_ID ?? ''

if (!REOWN_PROJECT_ID) {
  console.warn(
    '[WarrantyX] VITE_REOWN_PROJECT_ID is not set. ' +
      'Wallet connection UI may not load correctly. ' +
      'Create a project at https://cloud.reown.com'
  )
}

// ── Wagmi Adapter (used by Reown AppKit) ─────────────────────────────────────
export const wagmiAdapter = new WagmiAdapter({
  networks: SUPPORTED_CHAINS,
  projectId: REOWN_PROJECT_ID,
  ssr: false,
})

// ── Wagmi config ──────────────────────────────────────────────────────────────
export const wagmiConfig = wagmiAdapter.wagmiConfig

export { bohrTestnet }


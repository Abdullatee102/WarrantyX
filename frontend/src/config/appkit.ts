// ─────────────────────────────────────────────────────────────────────────────
// Reown AppKit Initialisation — WarrantyX
// ─────────────────────────────────────────────────────────────────────────────
// createAppKit MUST be imported from '@reown/appkit/react' for React integration.
// ─────────────────────────────────────────────────────────────────────────────
import { createAppKit } from '@reown/appkit/react'
import { SUPPORTED_CHAINS } from './chains'
import { REOWN_PROJECT_ID, wagmiAdapter } from './wagmi'

export const appkitModal = createAppKit({
  adapters: [wagmiAdapter],
  networks: SUPPORTED_CHAINS,
  defaultNetwork: SUPPORTED_CHAINS[0],
  projectId: REOWN_PROJECT_ID,
  metadata: {
    name: 'WarrantyX',
    description: 'Blockchain-based warranty platform — issue, verify, transfer, and claim product warranties on Bohr Testnet',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    icons: ['/shield.svg'],
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#0ea5e9',        // sky blue — trust & protection palette
    '--w3m-border-radius-master': '8px',
  },
})

export { REOWN_PROJECT_ID }

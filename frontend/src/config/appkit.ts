// ─────────────────────────────────────────────────────────────────────────────
// Reown AppKit Initialisation — WarrantyX
// ─────────────────────────────────────────────────────────────────────────────
// createAppKit MUST be called once, at module level, before any React code.
// ─────────────────────────────────────────────────────────────────────────────
import { createAppKit } from '@reown/appkit'
import { SUPPORTED_CHAINS } from './chains'
import { REOWN_PROJECT_ID, wagmiAdapter } from './wagmi'

createAppKit({
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


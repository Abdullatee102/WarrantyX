// ─────────────────────────────────────────────────────────────────────────────
// Blockchain / Network Configuration
// ─────────────────────────────────────────────────────────────────────────────
import { defineChain } from 'viem'

// ── Bohr Testnet ──────────────────────────────────────────────────────────────
export const bohrTestnet = defineChain({
  id: Number(import.meta.env.VITE_BOHR_CHAIN_ID ?? 968),
  name: 'Bohr Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Bohr Testnet Token',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_BOHR_RPC_URL ?? 'https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Bohr Explorer',
      url: 'https://scan.bohr.life',
    },
  },
  testnet: true,
})

// ── Supported chains ──────────────────────────────────────────────────────────
export const SUPPORTED_CHAINS: [typeof bohrTestnet, ...(typeof bohrTestnet)[]] = [bohrTestnet]

// ── Contract addresses ────────────────────────────────────────────────────────
export const CONTRACT_ADDRESS = (
  import.meta.env.VITE_WARRANTY_X_CONTRACT_ADDRESS ?? ''
) as `0x${string}`

// ── Network metadata ──────────────────────────────────────────────────────────
export const NETWORK_CONFIG = {
  defaultChainId: bohrTestnet.id,
  explorerUrl: 'https://scan.bohr.life',
  explorerTxPath: '/tx/',
  explorerAddressPath: '/address/',
} as const

export const explorerTx  = (hash: string) => `${NETWORK_CONFIG.explorerUrl}${NETWORK_CONFIG.explorerTxPath}${hash}`
export const explorerAddr = (addr: string) => `${NETWORK_CONFIG.explorerUrl}${NETWORK_CONFIG.explorerAddressPath}${addr}`


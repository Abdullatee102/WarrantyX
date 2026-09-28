/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REOWN_PROJECT_ID: string
  readonly VITE_BOHR_RPC_URL: string
  readonly VITE_BOHR_CHAIN_ID: string
  readonly VITE_WARRANTY_X_CONTRACT_ADDRESS: string
  readonly VITE_APP_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

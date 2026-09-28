import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { bohrTestnet } from '@/config/wagmi'
import styles from './NetworkGuard.module.css'

interface Props { children: React.ReactNode }

export default function NetworkGuard({ children }: Props) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected) return <>{children}</>

  if (chainId !== bohrTestnet.id) {
    return (
      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.icon}>🌐</div>
          <h2 className={styles.title}>Wrong Network</h2>
          <p className={styles.desc}>
            WarrantyX runs on <strong>Bohr Testnet (Chain 968)</strong>.<br />
            You are currently connected to chain <code>{chainId}</code>.
          </p>
          <button
            className={`btn btn--primary ${styles.btn}`}
            onClick={() => switchChain({ chainId: bohrTestnet.id })}
            disabled={isPending}
          >
            {isPending ? 'Switching…' : '⚡ Switch to Bohr Testnet'}
          </button>
          <p className={styles.hint}>
            If your wallet doesn't auto-switch, add the network manually:
            RPC: https://rpc.bohr.life · Chain ID: 968 · Symbol: BOT
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

import { explorerTx } from '@/config/chains'
import styles from './TxStatus.module.css'

interface Props {
  hash?: `0x${string}`
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error?: Error | null
  onReset?: () => void
  successMessage?: string
}

export default function TxStatus({
  hash, isPending, isConfirming, isSuccess, error, onReset, successMessage = 'Transaction confirmed!'
}: Props) {
  if (!hash && !isPending && !error) return null

  return (
    <div className={styles.root}>
      {isPending && !hash && (
        <div className={`${styles.item} ${styles.pending}`}>
          <span className="spinner" />
          <span>Confirm in your wallet…</span>
        </div>
      )}

      {hash && isConfirming && (
        <div className={`${styles.item} ${styles.confirming}`}>
          <span className="spinner" />
          <span>Transaction pending…{' '}
            <a href={explorerTx(hash)} target="_blank" rel="noopener noreferrer">View on explorer ↗</a>
          </span>
        </div>
      )}

      {isSuccess && (
        <div className={`${styles.item} ${styles.success}`}>
          <span>✅ {successMessage}</span>
          {hash && (
            <a href={explorerTx(hash)} target="_blank" rel="noopener noreferrer" className={styles.link}>
              View transaction ↗
            </a>
          )}
          {onReset && (
            <button className={`btn btn--sm btn--secondary ${styles.resetBtn}`} onClick={onReset}>
              Dismiss
            </button>
          )}
        </div>
      )}

      {error && (
        <div className={`${styles.item} ${styles.error}`}>
          <span>❌ {error.message.length > 100 ? error.message.slice(0, 100) + '…' : error.message}</span>
          {onReset && (
            <button className={`btn btn--sm btn--secondary ${styles.resetBtn}`} onClick={onReset}>
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  )
}

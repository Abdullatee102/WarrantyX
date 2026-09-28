import React from 'react'
import { useAccount, useBalance } from 'wagmi'
import { formatEther } from 'viem'
import styles from './WalletConnect.module.css'

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })

  const formattedBalance = balance ? parseFloat(formatEther(balance.value)).toFixed(3) : null

  return (
    <div className={styles.wrapper}>
      {isConnected && balance && (
        <span className={styles.balance}>
          {formattedBalance}{' '}
          <span className={styles.symbol}>{balance.symbol}</span>
        </span>
      )}
      <w3m-button />
    </div>
  )
}

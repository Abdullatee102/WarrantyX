import React from 'react'
import { useAccount } from 'wagmi'
import { Link } from 'react-router-dom'
import { useWarrantiesByOwner, useWarranty } from '@/hooks/useWarranty'
import { WarrantyStatus } from '@/types/warranty'
import { warrantyStatusLabel, warrantyStatusClass, shortAddr, formatDate, timeUntil } from '@/utils/format'
import styles from './MyWarranties.module.css'

export default function MyWarranties() {
  const { address, isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔒</div>
        <div className="empty-state__title">Wallet Not Connected</div>
        <p className="text-muted">Connect your wallet to discover and access your digital warranties.</p>
        <Link to="/recover" className="btn btn--primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
          🛡️ Recover My Warranty
        </Link>
      </div>
    )
  }

  return <MyWarrantiesContent address={address!} />
}

function MyWarrantiesContent({ address }: { address: `0x${string}` }) {
  const { data: ids, isLoading } = useWarrantiesByOwner(address)

  if (isLoading) {
    return <div className="empty-state"><span className="spinner" /></div>
  }

  if (!ids || ids.length === 0) {
    return (
      <div>
        <h1 className="section-title">📋 Recovered Warranties Collection</h1>
        <div className="empty-state">
          <div className="empty-state__icon">📦</div>
          <div className="empty-state__title">No digital warranties found</div>
          <p className="text-muted">No warranties are currently associated with wallet {shortAddr(address, 6)}.</p>
          <Link to="/recover" className="btn btn--secondary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
            🔍 Run Recovery Scanner
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '4px' }}>📋 Recovered Warranties Collection</h1>
          <p className="section-sub" style={{ marginBottom: 0 }}>Digital warranty records associated with your connected wallet.</p>
        </div>
        <div className="addr text-muted">{shortAddr(address, 8)}</div>
      </div>
      <div className={styles.grid}>
        {ids.map(id => (
          <WarrantyListItem key={id.toString()} warrantyId={id} />
        ))}
      </div>
    </div>
  )
}

function WarrantyListItem({ warrantyId }: { warrantyId: bigint }) {
  const { data: warranty, isLoading } = useWarranty(warrantyId)

  if (isLoading || !warranty) {
    return <div className={`card ${styles.skeleton}`}><span className="spinner" /></div>
  }

  const expiredByTime = BigInt(Math.floor(Date.now() / 1000)) >= warranty.expiresAt
  const effectiveStatus = expiredByTime && warranty.status === WarrantyStatus.Active ? 4 : warranty.status
  const isActive = warranty.status === WarrantyStatus.Active && !expiredByTime
  const isClaimPending = warranty.status === WarrantyStatus.ClaimPending

  return (
    <div className={`card card--hover ${styles.item}`}>
      <div className={styles.itemHeader}>
        <div className={styles.itemMeta}>
          <span className={styles.recoveredBadge}>Digital Record</span>
          <span className={styles.itemId}>#{warranty.warrantyId.toString()}</span>
        </div>
        <span className={`badge ${warrantyStatusClass(effectiveStatus)}`}>{warrantyStatusLabel(effectiveStatus)}</span>
      </div>
      <h3 className={styles.productName}>{warranty.productName}</h3>
      <div className={styles.productId}>Product ID: <span className="mono">{warranty.productId}</span></div>
      <div className={styles.details}>
        <span>Expires: <strong>{formatDate(warranty.expiresAt)}</strong></span>
        <span className={expiredByTime ? 'text-danger' : 'text-accent'}>{timeUntil(warranty.expiresAt)}</span>
      </div>
      <div className={styles.actions}>
        <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--sm btn--primary">View Details →</Link>
        {isActive && (
          <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--sm btn--secondary">📋 Submit Claim</Link>
        )}
        {isActive && (
          <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--sm btn--secondary">↔ Transfer</Link>
        )}
        {isClaimPending && (
          <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--sm btn--primary">🔍 Review Claim</Link>
        )}
      </div>
    </div>
  )
}

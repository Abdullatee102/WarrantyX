import { Link } from 'react-router-dom'
import type { Warranty } from '@/types/warranty'
import { WarrantyStatus } from '@/types/warranty'
import { warrantyStatusLabel, warrantyStatusClass, shortAddr, formatDate, timeUntil } from '@/utils/format'
import styles from './WarrantyCard.module.css'

interface Props {
  warranty: Warranty
  showActions?: boolean
  onTransfer?: () => void
  onClaim?: () => void
  onReview?: () => void
}

export default function WarrantyCard({ warranty, showActions, onTransfer, onClaim, onReview }: Props) {
  const isActive = warranty.status === WarrantyStatus.Active
  const isClaimPending = warranty.status === WarrantyStatus.ClaimPending
  const expiredByTime = BigInt(Math.floor(Date.now() / 1000)) >= warranty.expiresAt

  const canTransfer = isActive && !expiredByTime
  const canClaim = isActive && !expiredByTime
  const canReview = isClaimPending

  return (
    <div className={`card card--hover ${styles.card}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.idBadge}>#{warranty.warrantyId.toString()}</span>
          <span className={`badge ${warrantyStatusClass(expiredByTime && isActive ? 4 : warranty.status)}`}>
            {warrantyStatusLabel(expiredByTime && isActive ? 4 : warranty.status)}
          </span>
        </div>
        <Link to={`/warranty/${warranty.warrantyId.toString()}`} className={`btn btn--sm btn--secondary`}>
          View →
        </Link>
      </div>

      <h3 className={styles.productName}>{warranty.productName}</h3>
      <div className={styles.productId} title={warranty.productId}>Product ID: <span className="mono">{warranty.productId}</span></div>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Issued</span>
          <span className={styles.metaValue}>{formatDate(warranty.issuedAt)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Expires</span>
          <span className={`${styles.metaValue} ${expiredByTime ? 'text-danger' : ''}`}>
            {formatDate(warranty.expiresAt)}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Time left</span>
          <span className={`${styles.metaValue} ${expiredByTime ? 'text-muted' : 'text-accent'}`}>
            {timeUntil(warranty.expiresAt)}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Issuer</span>
          <span className={`${styles.metaValue} addr`}>{shortAddr(warranty.issuer)}</span>
        </div>
      </div>

      {(warranty.claimCount > 0n) && (
        <div className={styles.claimSummary}>
          📋 {warranty.claimCount.toString()} claim{warranty.claimCount !== 1n ? 's' : ''}
          {warranty.approvedClaimCount > 0n && ` · ${warranty.approvedClaimCount.toString()} approved`}
          {warranty.rejectedClaimCount > 0n && ` · ${warranty.rejectedClaimCount.toString()} rejected`}
        </div>
      )}

      {showActions && (
        <div className={styles.actions}>
          {canTransfer && onTransfer && (
            <button className="btn btn--sm btn--secondary" onClick={onTransfer}>↔ Transfer</button>
          )}
          {canClaim && onClaim && (
            <button className="btn btn--sm btn--primary" onClick={onClaim}>📋 Submit Claim</button>
          )}
          {canReview && onReview && (
            <button className="btn btn--sm btn--primary" onClick={onReview}>🔍 Review Claim</button>
          )}
        </div>
      )}
    </div>
  )
}

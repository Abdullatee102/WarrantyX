import { useAccount } from 'wagmi'
import { useWarrantiesByOwner, usePlatformStats, useIsIssuer } from '@/hooks/useWarranty'
import { useWarranty } from '@/hooks/useWarranty'
import { WarrantyStatus } from '@/types/warranty'
import { shortAddr, formatDate } from '@/utils/format'
import { explorerAddr } from '@/config/chains'
import { Link } from 'react-router-dom'
import styles from './Profile.module.css'

export default function Profile() {
  const { address, isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">👤</div>
        <div className="empty-state__title">Connect Wallet</div>
        <p className="text-muted">Connect your wallet to view your profile.</p>
      </div>
    )
  }

  return <ProfileContent address={address!} />
}

function ProfileContent({ address }: { address: `0x${string}` }) {
  const { data: ids } = useWarrantiesByOwner(address)
  const { data: isIssuer } = useIsIssuer(address)

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <div className={styles.avatar}>👤</div>
        <div className={styles.heroInfo}>
          <h1 className={styles.title}>My Profile</h1>
          <a href={explorerAddr(address)} target="_blank" rel="noopener noreferrer" className={`${styles.addr} addr`}>
            {address} ↗
          </a>
          {isIssuer && (
            <span className="badge badge--active">Authorized Issuer</span>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statVal}>{ids?.length ?? 0}</div>
          <div className={styles.statLabel}>Warranties Owned</div>
        </div>
        {ids && <ClaimStats ids={ids} />}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>My Warranties</h3>
        {!ids || ids.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📦</div>
            <div className="empty-state__title">No warranties yet</div>
          </div>
        ) : (
          <div className={styles.warrantyList}>
            {ids.map(id => <ProfileWarrantyRow key={id.toString()} id={id} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function ClaimStats({ ids }: { ids: bigint[] }) {
  // We just show warranty count for simplicity — full per-warranty stats would need N reads
  return (
    <>
      <div className={`card ${styles.statCard}`}>
        <div className={styles.statVal}>{ids.length}</div>
        <div className={styles.statLabel}>Active Holdings</div>
      </div>
    </>
  )
}

function ProfileWarrantyRow({ id }: { id: bigint }) {
  const { data: warranty } = useWarranty(id)
  if (!warranty) return null
  const expiredByTime = BigInt(Math.floor(Date.now() / 1000)) >= warranty.expiresAt
  const status = expiredByTime && warranty.status === WarrantyStatus.Active ? 4 : warranty.status
  const statusColors: Record<number, string> = { 0: '#22c55e', 1: '#f59e0b', 2: '#0ea5e9', 3: '#ef4444', 4: '#64748b', 5: '#8b5cf6' }
  const statusLabels: Record<number, string> = { 0: 'Active', 1: 'Claim Pending', 2: 'Approved', 3: 'Rejected', 4: 'Expired', 5: 'Cancelled' }

  return (
    <Link to={`/warranty/${id.toString()}`} className={`card card--hover ${styles.warRow}`}>
      <div className={styles.warInfo}>
        <span className={styles.warId}>#{id.toString()}</span>
        <span className={styles.warName}>{warranty.productName}</span>
      </div>
      <div className={styles.warRight}>
        <span style={{ color: statusColors[status], fontSize: '0.75rem', fontWeight: 600 }}>{statusLabels[status]}</span>
        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Expires {formatDate(warranty.expiresAt)}</span>
      </div>
    </Link>
  )
}

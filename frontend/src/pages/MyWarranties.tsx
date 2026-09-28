import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { Link } from 'react-router-dom'
import { useWarrantiesByOwner, useUserRegistrations, useWarranty } from '@/hooks/useWarranty'
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
        <p className="text-muted">Connect your wallet to view your active warranties and registration requests.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/register" className="btn btn--primary" style={{ textDecoration: 'none' }}>
            📝 Register New Warranty
          </Link>
          <Link to="/recover" className="btn btn--secondary" style={{ textDecoration: 'none' }}>
            🛡️ Recover Warranty
          </Link>
        </div>
      </div>
    )
  }

  return <MyWarrantiesContent address={address!} />
}

function MyWarrantiesContent({ address }: { address: `0x${string}` }) {
  const [tab, setTab] = useState<'active' | 'registrations'>('active')
  const { data: activeIds, isLoading: loadingActive } = useWarrantiesByOwner(address)
  const { data: registrationIds, isLoading: loadingRegistrations } = useUserRegistrations(address)

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '4px' }}>📋 Digital Warranties & Requests</h1>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            Manage active warranty holdings and track user registration submission statuses.
          </p>
        </div>
        <div className="addr text-muted">{shortAddr(address, 8)}</div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${tab === 'active' ? styles.tabActive : ''}`}
          onClick={() => setTab('active')}
        >
          🛡️ Active Warranties ({activeIds?.length ?? 0})
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'registrations' ? styles.tabActive : ''}`}
          onClick={() => setTab('registrations')}
        >
          📝 My Registrations ({registrationIds?.length ?? 0})
        </button>
      </div>

      {tab === 'active' && (
        <div className={styles.tabContent}>
          {loadingActive && <div className="empty-state"><span className="spinner" /> Loading active warranties…</div>}

          {!loadingActive && (!activeIds || activeIds.length === 0) && (
            <div className="empty-state">
              <div className="empty-state__icon">📦</div>
              <div className="empty-state__title">No Active Warranties</div>
              <p className="text-muted">No approved digital warranties are currently associated with wallet {shortAddr(address, 6)}.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Link to="/register" className="btn btn--primary" style={{ textDecoration: 'none' }}>
                  📝 Register a Warranty
                </Link>
                <Link to="/recover" className="btn btn--secondary" style={{ textDecoration: 'none' }}>
                  🔍 Recover Existing Warranty
                </Link>
              </div>
            </div>
          )}

          <div className={styles.grid}>
            {activeIds?.map(id => (
              <WarrantyListItem key={id.toString()} warrantyId={id} />
            ))}
          </div>
        </div>
      )}

      {tab === 'registrations' && (
        <div className={styles.tabContent}>
          {loadingRegistrations && <div className="empty-state"><span className="spinner" /> Loading registration requests…</div>}

          {!loadingRegistrations && (!registrationIds || registrationIds.length === 0) && (
            <div className="empty-state">
              <div className="empty-state__icon">📝</div>
              <div className="empty-state__title">No Registration Submissions</div>
              <p className="text-muted">You haven't submitted any warranty registration requests yet.</p>
              <Link to="/register" className="btn btn--primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
                Register Your First Warranty →
              </Link>
            </div>
          )}

          <div className={styles.grid}>
            {registrationIds?.map(id => (
              <RegistrationListItem key={id.toString()} warrantyId={id} />
            ))}
          </div>
        </div>
      )}
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
        <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--sm btn--primary" style={{ textDecoration: 'none' }}>View Details →</Link>
        {isActive && (
          <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--sm btn--secondary" style={{ textDecoration: 'none' }}>📋 Submit Claim</Link>
        )}
        {isActive && (
          <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--sm btn--secondary" style={{ textDecoration: 'none' }}>↔ Transfer</Link>
        )}
        {isClaimPending && (
          <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--sm btn--primary" style={{ textDecoration: 'none' }}>🔍 Review Claim</Link>
        )}
      </div>
    </div>
  )
}

function RegistrationListItem({ warrantyId }: { warrantyId: bigint }) {
  const { data: warranty, isLoading } = useWarranty(warrantyId)

  if (isLoading || !warranty) {
    return <div className={`card ${styles.skeleton}`}><span className="spinner" /></div>
  }

  const expiredByTime = BigInt(Math.floor(Date.now() / 1000)) >= warranty.expiresAt
  const effectiveStatus = expiredByTime && warranty.status === WarrantyStatus.Active ? 4 : warranty.status

  return (
    <div className={`card ${styles.item}`}>
      <div className={styles.itemHeader}>
        <div className={styles.itemMeta}>
          <span className={styles.itemId}>Registration #{warranty.warrantyId.toString()}</span>
        </div>
        <span className={`badge ${warrantyStatusClass(effectiveStatus)}`}>{warrantyStatusLabel(effectiveStatus)}</span>
      </div>
      <h3 className={styles.productName}>{warranty.productName}</h3>
      <div className={styles.productId}>Product Serial: <span className="mono">{warranty.productId}</span></div>
      
      {warranty.proofRef && (
        <div className={styles.proofText}>
          Proof Ref: <span className="mono">{warranty.proofRef}</span>
        </div>
      )}

      {warranty.rejectionReason && (
        <div className="alert alert--error" style={{ fontSize: '0.8rem', padding: '0.5rem', marginTop: '0.5rem' }}>
          <strong>Rejection Reason:</strong> {warranty.rejectionReason}
        </div>
      )}

      <div className={styles.details} style={{ marginTop: '0.5rem' }}>
        <span>Submitted: <strong>{formatDate(warranty.issuedAt)}</strong></span>
      </div>

      {warranty.status === WarrantyStatus.Active && (
        <div className={styles.actions}>
          <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--sm btn--primary" style={{ textDecoration: 'none' }}>
            View Active Warranty →
          </Link>
        </div>
      )}
    </div>
  )
}

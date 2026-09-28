import { useState } from 'react'
import { useWarranty, useIsWarrantyValid, useTransferHistory, useClaims } from '@/hooks/useWarranty'
import { WarrantyStatus } from '@/types/warranty'
import { warrantyStatusLabel, warrantyStatusClass, shortAddr, formatDate, timeUntil } from '@/utils/format'
import { explorerAddr } from '@/config/chains'
import styles from './Verify.module.css'

export default function Verify() {
  const [input, setInput] = useState('')
  const [searchId, setSearchId] = useState<bigint | undefined>()
  const [hasSearched, setHasSearched] = useState(false)

  const { data: warranty, isLoading, error } = useWarranty(searchId)
  const { data: isValid } = useIsWarrantyValid(searchId)
  const { data: history } = useTransferHistory(searchId)
  const { data: claims } = useClaims(searchId)

  function handleSearch() {
    const id = parseInt(input.trim(), 10)
    if (isNaN(id) || id < 0) return
    setSearchId(BigInt(id))
    setHasSearched(true)
  }

  const expiredByTime = warranty ? BigInt(Math.floor(Date.now() / 1000)) >= warranty.expiresAt : false
  const effectiveStatus = warranty && expiredByTime && warranty.status === WarrantyStatus.Active ? 4 : (warranty?.status ?? 0)

  return (
    <div className={styles.root}>
      <h1 className="section-title">🔍 Verify Warranty</h1>
      <p className="section-sub">Enter a Warranty ID to retrieve its on-chain information. No login required.</p>

      <div className={styles.searchBox}>
        <input
          type="number"
          min="0"
          placeholder="Enter Warranty ID (e.g. 0, 1, 2...)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className={styles.searchInput}
        />
        <button className={`btn btn--primary ${styles.searchBtn}`} onClick={handleSearch} disabled={!input.trim()}>
          Verify
        </button>
      </div>

      {isLoading && hasSearched && (
        <div className={styles.loading}><span className="spinner" /> Loading warranty data from chain…</div>
      )}

      {error && hasSearched && (
        <div className={`alert alert--error ${styles.result}`}>
          <div className={styles.notFoundIcon}>❌</div>
          <h3>Warranty Not Found</h3>
          <p>No warranty exists with ID #{input}. Check the ID and try again.</p>
        </div>
      )}

      {warranty && !isLoading && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <div className={styles.resultHeaderLeft}>
              <span className={styles.checkmark}>✓</span>
              <div>
                <h2 className={styles.resultTitle}>Warranty #{warranty.warrantyId.toString()} Found</h2>
                <p className={styles.resultSub}>{warranty.productName}</p>
              </div>
            </div>
            <span className={`badge ${warrantyStatusClass(effectiveStatus)}`}>
              {warrantyStatusLabel(effectiveStatus)}
            </span>
          </div>

          <div className={styles.grid}>
            <InfoRow label="Product ID" value={warranty.productId} mono />
            <InfoRow label="Product Name" value={warranty.productName} />
            <InfoRow label="Issuer" value={shortAddr(warranty.issuer, 8)} mono link={explorerAddr(warranty.issuer)} />
            <InfoRow label="Current Owner" value={shortAddr(warranty.owner, 8)} mono link={explorerAddr(warranty.owner)} />
            <InfoRow label="Issued" value={formatDate(warranty.issuedAt)} />
            <InfoRow label="Expires" value={formatDate(warranty.expiresAt)} />
            <InfoRow label="Time Remaining" value={timeUntil(warranty.expiresAt)} />
            <InfoRow label="Transfers" value={warranty.transferCount.toString()} />
            <InfoRow label="Total Claims" value={warranty.claimCount.toString()} />
            <InfoRow label="Approved Claims" value={warranty.approvedClaimCount.toString()} />
            {warranty.productMetaRef && (
              <InfoRow label="Product Metadata" value={warranty.productMetaRef} link={warranty.productMetaRef} />
            )}
          </div>

          {/* Validity banner */}
          <div className={`alert ${isValid ? 'alert--success' : 'alert--error'}`}>
            {isValid
              ? '✅ This warranty is currently ACTIVE and VALID'
              : '⚠️ This warranty is NOT currently active (expired, cancelled, or claim pending)'}
          </div>

          {/* Transfer history */}
          {history && history.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionHead}>Ownership Timeline</h4>
              <div className={styles.timeline}>
                <TimelineEntry label="Warranty Issued" addr={warranty.issuer} time={warranty.issuedAt} first />
                {[...history].map((rec, i) => (
                  <TimelineEntry key={i} label="Transferred" addr={rec.to} time={rec.timestamp} />
                ))}
              </div>
            </div>
          )}

          {/* Claims */}
          {claims && claims.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionHead}>Claim History</h4>
              {claims.map((claim, i) => (
                <div key={i} className={styles.claimRow}>
                  <div className={styles.claimMeta}>
                    <span>Claim #{i + 1}</span>
                    <span className={`badge ${claim.status === 1 ? 'badge--approved' : claim.status === 2 ? 'badge--rejected' : 'badge--pending'}`}>
                      {claim.status === 1 ? 'Approved' : claim.status === 2 ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                  <p className={styles.claimDesc}>{claim.description}</p>
                  {claim.documentRef && (
                    <a href={claim.documentRef} target="_blank" rel="noopener noreferrer" className={styles.claimRef}>
                      View document ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      {link
        ? <a href={link} target="_blank" rel="noopener noreferrer" className={`${styles.infoValue} ${mono ? 'mono' : ''}`}>{value} ↗</a>
        : <span className={`${styles.infoValue} ${mono ? 'mono' : ''}`}>{value}</span>
      }
    </div>
  )
}

function TimelineEntry({ label, addr, time, first }: { label: string; addr: string; time: bigint; first?: boolean }) {
  return (
    <div className={styles.timelineEntry}>
      <div className={styles.timelineDot} />
      <div className={styles.timelineContent}>
        <div className={styles.timelineLabel}>{label}</div>
        <div className={`addr ${styles.timelineAddr}`}>{addr}</div>
        <div className={styles.timelineTime}>{formatDate(time)}</div>
      </div>
    </div>
  )
}

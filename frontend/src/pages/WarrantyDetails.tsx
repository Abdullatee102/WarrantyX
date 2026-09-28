import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { isAddress, keccak256, stringToHex } from 'viem'
import {
  useWarranty, useTransferHistory, useClaims,
  useTransferWarranty, useSubmitClaim, useReviewClaim,
  useCancelWarranty, useIsIssuer,
} from '@/hooks/useWarranty'
import { WarrantyStatus, ClaimStatus } from '@/types/warranty'
import { warrantyStatusLabel, warrantyStatusClass, claimStatusLabel, claimStatusClass, shortAddr, formatDate, formatDateTime, timeUntil, parseContractError } from '@/utils/format'
import { explorerAddr } from '@/config/chains'
import TxStatus from '@/components/TxStatus'
import styles from './WarrantyDetails.module.css'

export default function WarrantyDetails() {
  const { id } = useParams<{ id: string }>()
  const warrantyId = BigInt(id ?? '0')
  const { address } = useAccount()

  const { data: warranty, isLoading, error } = useWarranty(warrantyId)
  const { data: history } = useTransferHistory(warrantyId)
  const { data: claims } = useClaims(warrantyId)
  const { data: isIssuer } = useIsIssuer(address)

  const transferHook = useTransferWarranty(warrantyId)
  const claimHook = useSubmitClaim(warrantyId)
  const reviewHook = useReviewClaim(warrantyId)
  const cancelHook = useCancelWarranty(warrantyId)

  const [showTransferForm, setShowTransferForm] = useState(false)
  const [showClaimForm, setShowClaimForm] = useState(false)
  const [transferTo, setTransferTo] = useState('')
  const [claimDesc, setClaimDesc] = useState('')
  const [claimDocRef, setClaimDocRef] = useState('')
  const [txError, setTxError] = useState('')

  if (isLoading) return <div className="empty-state"><span className="spinner" /></div>
  if (error || !warranty) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">❌</div>
        <div className="empty-state__title">Warranty Not Found</div>
        <p className="text-muted">No warranty found with ID #{id}</p>
        <Link to="/verify" className="btn btn--primary" style={{ marginTop: '1rem' }}>Verify Another</Link>
      </div>
    )
  }

  const nowS = BigInt(Math.floor(Date.now() / 1000))
  const expiredByTime = nowS >= warranty.expiresAt
  const effectiveStatus = expiredByTime && warranty.status === WarrantyStatus.Active ? 4 : warranty.status
  const isOwner = address?.toLowerCase() === warranty.owner.toLowerCase()
  const isWarrantyIssuer = address?.toLowerCase() === warranty.issuer.toLowerCase()
  const isActive = warranty.status === WarrantyStatus.Active && !expiredByTime
  const isClaimPending = warranty.status === WarrantyStatus.ClaimPending

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setTxError('')
    if (!isAddress(transferTo)) { setTxError('Invalid address'); return }
    try {
      await transferHook.transferWarranty(transferTo as `0x${string}`)
      setShowTransferForm(false)
      setTransferTo('')
    } catch (err) { setTxError(parseContractError(err)) }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault()
    setTxError('')
    if (!claimDesc.trim()) { setTxError('Description is required'); return }
    try {
      const metaHash = claimDocRef.trim()
        ? keccak256(stringToHex(claimDocRef.trim()))
        : '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
      await claimHook.submitClaim({ description: claimDesc.trim(), metadataHash: metaHash, documentRef: claimDocRef.trim() })
      setShowClaimForm(false)
      setClaimDesc(''); setClaimDocRef('')
    } catch (err) { setTxError(parseContractError(err)) }
  }

  async function handleReview(approve: boolean) {
    setTxError('')
    try {
      await reviewHook.reviewClaim(approve)
    } catch (err) { setTxError(parseContractError(err)) }
  }

  async function handleCancel() {
    if (!confirm('Cancel this warranty? This cannot be undone.')) return
    setTxError('')
    try { await cancelHook.cancelWarranty() } catch (err) { setTxError(parseContractError(err)) }
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/my-warranties">My Warranties</Link> / #{warrantyId.toString()}
          </div>
          <h1 className={styles.title}>{warranty.productName}</h1>
          <div className={styles.titleMeta}>
            <span className={`badge ${warrantyStatusClass(effectiveStatus)}`}>{warrantyStatusLabel(effectiveStatus)}</span>
            <span className="addr text-muted">{warranty.productId}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {isOwner && isActive && !showTransferForm && !showClaimForm && (
            <button className="btn btn--secondary" onClick={() => setShowTransferForm(true)}>↔ Transfer</button>
          )}
          {isOwner && isActive && !showClaimForm && !showTransferForm && (
            <button className="btn btn--primary" onClick={() => setShowClaimForm(true)}>📋 Submit Claim</button>
          )}
          {isWarrantyIssuer && warranty.status !== WarrantyStatus.Cancelled && (
            <button className="btn btn--danger btn--sm" onClick={handleCancel} disabled={cancelHook.isPending}>
              {cancelHook.isPending ? 'Cancelling…' : 'Cancel Warranty'}
            </button>
          )}
        </div>
      </div>

      {txError && <div className="alert alert--error">{txError}</div>}

      {/* Transfer form */}
      {showTransferForm && (
        <div className={`card ${styles.actionCard}`}>
          <h3>↔ Transfer Warranty Ownership</h3>
          <p className="text-muted">This transfers the warranty to the new owner. Only do this when you sell the product.</p>
          <form onSubmit={handleTransfer} className={styles.actionForm}>
            <input
              placeholder="New owner address (0x...)"
              value={transferTo}
              onChange={e => setTransferTo(e.target.value)}
              className="mono"
            />
            <div className={styles.formActions}>
              <button type="button" className="btn btn--secondary" onClick={() => { setShowTransferForm(false); setTxError('') }}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={transferHook.isPending || transferHook.receipt.isLoading}>
                {transferHook.isPending || transferHook.receipt.isLoading ? 'Transferring…' : 'Confirm Transfer'}
              </button>
            </div>
          </form>
          <TxStatus hash={transferHook.hash} isPending={transferHook.isPending} isConfirming={transferHook.receipt.isLoading} isSuccess={transferHook.receipt.isSuccess} error={transferHook.error as Error | null} successMessage="Warranty transferred!" />
        </div>
      )}

      {/* Claim form */}
      {showClaimForm && (
        <div className={`card ${styles.actionCard}`}>
          <h3>📋 Submit Warranty Claim</h3>
          <p className="text-muted">Describe the defect or issue. The issuer will review your claim.</p>
          <form onSubmit={handleClaim} className={styles.actionForm}>
            <div className="form-group">
              <label className="form-label">Claim Description *</label>
              <textarea rows={4} placeholder="Describe the product defect in detail..." value={claimDesc} onChange={e => setClaimDesc(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Supporting Document Reference</label>
              <input placeholder="ipfs://Qm... or https://..." value={claimDocRef} onChange={e => setClaimDocRef(e.target.value)} />
              <span className="form-hint">Optional IPFS CID or URL with photos/receipts</span>
            </div>
            <div className={styles.formActions}>
              <button type="button" className="btn btn--secondary" onClick={() => { setShowClaimForm(false); setTxError('') }}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={claimHook.isPending || claimHook.receipt.isLoading}>
                {claimHook.isPending || claimHook.receipt.isLoading ? 'Submitting…' : 'Submit Claim'}
              </button>
            </div>
          </form>
          <TxStatus hash={claimHook.hash} isPending={claimHook.isPending} isConfirming={claimHook.receipt.isLoading} isSuccess={claimHook.receipt.isSuccess} error={claimHook.error as Error | null} successMessage="Claim submitted!" />
        </div>
      )}

      {/* Claim review (issuer only) */}
      {isWarrantyIssuer && isClaimPending && claims && claims.length > 0 && (() => {
        const pending = claims[claims.length - 1]
        return (
          <div className={`card ${styles.reviewCard}`}>
            <h3>🔍 Review Pending Claim</h3>
            <p className={styles.claimDesc}><strong>Claim by:</strong> <span className="addr">{shortAddr(pending.claimant, 8)}</span></p>
            <p className={styles.claimDesc}><strong>Description:</strong> {pending.description}</p>
            {pending.documentRef && <p className={styles.claimDesc}><strong>Document:</strong> <a href={pending.documentRef} target="_blank" rel="noopener noreferrer">{pending.documentRef} ↗</a></p>}
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Submitted: {formatDateTime(pending.submittedAt)}</p>
            <div className={styles.reviewActions}>
              <button className="btn btn--success" onClick={() => handleReview(true)} disabled={reviewHook.isPending || reviewHook.receipt.isLoading}>
                ✅ Approve Claim
              </button>
              <button className="btn btn--danger" onClick={() => handleReview(false)} disabled={reviewHook.isPending || reviewHook.receipt.isLoading}>
                ❌ Reject Claim
              </button>
            </div>
            <TxStatus hash={reviewHook.hash} isPending={reviewHook.isPending} isConfirming={reviewHook.receipt.isLoading} isSuccess={reviewHook.receipt.isSuccess} error={reviewHook.error as Error | null} successMessage="Claim reviewed!" />
          </div>
        )
      })()}

      {/* Warranty info grid */}
      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <div className={`card ${styles.infoCard}`}>
            <h3 className={styles.cardTitle}>Warranty Details</h3>
            <dl className={styles.dl}>
              <dt>Warranty ID</dt><dd className="mono">#{warranty.warrantyId.toString()}</dd>
              <dt>Product ID</dt><dd className="mono">{warranty.productId}</dd>
              <dt>Product Name</dt><dd>{warranty.productName}</dd>
              <dt>Issuer</dt><dd><a href={explorerAddr(warranty.issuer)} target="_blank" rel="noopener noreferrer" className="addr">{shortAddr(warranty.issuer, 10)}</a> {isWarrantyIssuer && <span className={styles.youBadge}>you</span>}</dd>
              <dt>Current Owner</dt><dd><a href={explorerAddr(warranty.owner)} target="_blank" rel="noopener noreferrer" className="addr">{shortAddr(warranty.owner, 10)}</a> {isOwner && <span className={styles.youBadge}>you</span>}</dd>
              <dt>Issued</dt><dd>{formatDate(warranty.issuedAt)}</dd>
              <dt>Expires</dt><dd className={expiredByTime ? 'text-danger' : ''}>{formatDate(warranty.expiresAt)}</dd>
              <dt>Remaining</dt><dd className={expiredByTime ? 'text-danger' : 'text-accent'}>{timeUntil(warranty.expiresAt)}</dd>
              <dt>Transfers</dt><dd>{warranty.transferCount.toString()}</dd>
              {warranty.productMetaRef && (<><dt>Metadata Ref</dt><dd><a href={warranty.productMetaRef} target="_blank" rel="noopener noreferrer">{warranty.productMetaRef.slice(0, 30)}...</a></dd></>)}
            </dl>
          </div>

          <div className={`card ${styles.infoCard}`}>
            <h3 className={styles.cardTitle}>Claim Summary</h3>
            <dl className={styles.dl}>
              <dt>Total Claims</dt><dd>{warranty.claimCount.toString()}</dd>
              <dt>Approved</dt><dd className="text-success">{warranty.approvedClaimCount.toString()}</dd>
              <dt>Rejected</dt><dd className="text-danger">{warranty.rejectedClaimCount.toString()}</dd>
            </dl>
          </div>
        </div>

        <div className={styles.rightCol}>
          {/* Ownership Timeline */}
          <div className={`card ${styles.timelineCard}`}>
            <h3 className={styles.cardTitle}>Ownership Timeline</h3>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.tDot} />
                <div className={styles.tContent}>
                  <div className={styles.tLabel}>Warranty Created</div>
                  <div className="addr">{shortAddr(warranty.issuer, 8)}</div>
                  <div className={styles.tTime}>{formatDate(warranty.issuedAt)}</div>
                </div>
              </div>
              {(history ?? []).map((rec, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.tDot} />
                  <div className={styles.tContent}>
                    <div className={styles.tLabel}>Transferred to</div>
                    <div className="addr">{shortAddr(rec.to, 8)}</div>
                    <div className={styles.tTime}>{formatDate(rec.timestamp)}</div>
                  </div>
                </div>
              ))}
              <div className={`${styles.timelineItem} ${styles.tCurrent}`}>
                <div className={`${styles.tDot} ${styles.tDotCurrent}`} />
                <div className={styles.tContent}>
                  <div className={styles.tLabel}>Current Owner</div>
                  <div className="addr">{shortAddr(warranty.owner, 8)} {isOwner && <span className={styles.youBadge}>you</span>}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Claim History */}
          {claims && claims.length > 0 && (
            <div className={`card ${styles.claimsCard}`}>
              <h3 className={styles.cardTitle}>Claim History</h3>
              {claims.map((claim, i) => (
                <div key={i} className={styles.claimRow}>
                  <div className={styles.claimHeader}>
                    <span className={styles.claimNum}>Claim #{i + 1}</span>
                    <span className={`badge ${claimStatusClass(claim.status)}`}>{claimStatusLabel(claim.status)}</span>
                  </div>
                  <p className={styles.claimText}>{claim.description}</p>
                  {claim.documentRef && <a href={claim.documentRef} target="_blank" rel="noopener noreferrer" className={styles.claimDoc}>View document ↗</a>}
                  <div className={styles.claimMeta}>
                    <span>By: <span className="addr">{shortAddr(claim.claimant, 6)}</span></span>
                    <span>{formatDate(claim.submittedAt)}</span>
                    {claim.reviewer !== '0x0000000000000000000000000000000000000000' && (
                      <span>Reviewed: {formatDate(claim.reviewedAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

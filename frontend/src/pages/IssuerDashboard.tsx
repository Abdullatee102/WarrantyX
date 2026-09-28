import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import {
  usePendingRegistrations,
  useWarranty,
  useApproveWarranty,
  useRejectWarranty,
  useIsIssuer,
  useAddIssuer,
} from '@/hooks/useWarranty'
import { shortAddr, formatDate, parseContractError } from '@/utils/format'
import { explorerAddr } from '@/config/chains'
import TxStatus from '@/components/TxStatus'
import styles from './IssuerDashboard.module.css'

export default function IssuerDashboard() {
  const { address, isConnected } = useAccount()
  const { data: isIssuer, isLoading: checkingIssuer } = useIsIssuer(address)
  const { data: pendingIds, isLoading: loadingPending } = usePendingRegistrations()

  const [addIssuerAddr, setAddIssuerAddr] = useState('')
  const [addIssuerErr, setAddIssuerErr] = useState('')
  const addIssuerHook = useAddIssuer()

  if (!isConnected) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔒</div>
        <div className="empty-state__title">Wallet Not Connected</div>
        <p className="text-muted">Connect your wallet to access the Issuer Verification Dashboard.</p>
      </div>
    )
  }

  if (checkingIssuer) {
    return <div className="empty-state"><span className="spinner" /> Verification in progress…</div>
  }

  if (!isIssuer) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🚫</div>
        <div className="empty-state__title">Authorized Issuer Access Only</div>
        <p className="text-muted">
          Your wallet address <code className="mono">{shortAddr(address!, 8)}</code> is not registered as an authorized warranty issuer.
        </p>
      </div>
    )
  }

  async function handleAddIssuer(e: React.FormEvent) {
    e.preventDefault()
    setAddIssuerErr('')
    if (!isAddress(addIssuerAddr)) { setAddIssuerErr('Invalid EVM wallet address'); return }
    try {
      await addIssuerHook.addIssuer(addIssuerAddr as `0x${string}`)
      setAddIssuerAddr('')
    } catch (err) {
      setAddIssuerErr(parseContractError(err))
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className="section-title">⚙️ Issuer Verification Dashboard</h1>
          <p className="section-sub">
            Review and approve incoming customer warranty registration requests on Bohr Testnet.
          </p>
        </div>
        <div className={styles.issuerBadge}>
          <span className={styles.badgeIcon}>👑</span>
          <span>Authorized Issuer</span>
        </div>
      </div>

      {/* Pending Registrations Queue */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Pending Registration Queue ({pendingIds?.length ?? 0})
          </h2>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            Verify customer proof of purchase before approval
          </span>
        </div>

        {loadingPending && <div className="empty-state"><span className="spinner" /> Loading pending queue…</div>}

        {!loadingPending && (!pendingIds || pendingIds.length === 0) && (
          <div className="empty-state">
            <div className="empty-state__icon">🎉</div>
            <div className="empty-state__title">Queue Empty</div>
            <p className="text-muted">There are no pending warranty registration requests requiring verification at this time.</p>
          </div>
        )}

        <div className={styles.grid}>
          {pendingIds?.map(id => (
            <PendingRegistrationCard key={id.toString()} warrantyId={id} />
          ))}
        </div>
      </div>

      {/* Issuer Management Section */}
      <div className={styles.adminSection}>
        <div className={`card ${styles.adminCard}`}>
          <h3>➕ Grant Issuer Authorization</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Add another wallet address as an authorized warranty issuer.
          </p>
          <form onSubmit={handleAddIssuer} className={styles.adminForm}>
            <input
              placeholder="0x... Wallet address to authorize"
              value={addIssuerAddr}
              onChange={e => setAddIssuerAddr(e.target.value)}
              className="mono"
            />
            <button
              type="submit"
              className="btn btn--secondary"
              disabled={addIssuerHook.isPending || addIssuerHook.receipt.isLoading}
            >
              {addIssuerHook.isPending ? 'Authorizing…' : 'Authorize Issuer'}
            </button>
          </form>
          {addIssuerErr && <p className="form-error" style={{ marginTop: '0.5rem' }}>{addIssuerErr}</p>}
          <TxStatus
            hash={addIssuerHook.hash}
            isPending={addIssuerHook.isPending}
            isConfirming={addIssuerHook.receipt.isLoading}
            isSuccess={addIssuerHook.receipt.isSuccess}
            error={addIssuerHook.error as Error | null}
            onReset={addIssuerHook.reset}
            successMessage="New issuer successfully authorized!"
          />
        </div>
      </div>
    </div>
  )
}

function PendingRegistrationCard({ warrantyId }: { warrantyId: bigint }) {
  const { data: warranty, isLoading } = useWarranty(warrantyId)
  const approveHook = useApproveWarranty()
  const rejectHook = useRejectWarranty()

  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionErr, setActionErr] = useState('')

  if (isLoading || !warranty) {
    return <div className={`card ${styles.skeleton}`}><span className="spinner" /></div>
  }

  async function handleApprove() {
    setActionErr('')
    try {
      await approveHook.approveWarranty(warrantyId)
    } catch (err) {
      setActionErr(parseContractError(err))
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault()
    setActionErr('')
    if (!rejectReason.trim()) { setActionErr('Please enter a rejection reason'); return }
    try {
      await rejectHook.rejectWarranty(warrantyId, rejectReason.trim())
      setRejectMode(false)
    } catch (err) {
      setActionErr(parseContractError(err))
    }
  }

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardId}>Registration #{warranty.warrantyId.toString()}</span>
        <span className="badge badge--pending">Pending Verification</span>
      </div>

      <h3 className={styles.productName}>{warranty.productName}</h3>

      <dl className={styles.dl}>
        <dt>Serial / ID:</dt>
        <dd className="mono">{warranty.productId}</dd>

        <dt>Registrant Address:</dt>
        <dd>
          <a href={explorerAddr(warranty.owner)} target="_blank" rel="noopener noreferrer" className="addr">
            {shortAddr(warranty.owner, 8)} ↗
          </a>
        </dd>

        <dt>Proof of Purchase:</dt>
        <dd className={styles.proofVal}>
          {warranty.proofRef.startsWith('http') || warranty.proofRef.startsWith('ipfs') ? (
            <a href={warranty.proofRef} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
              {warranty.proofRef} ↗
            </a>
          ) : (
            <span>{warranty.proofRef}</span>
          )}
        </dd>

        <dt>Submitted Date:</dt>
        <dd>{formatDate(warranty.issuedAt)}</dd>
      </dl>

      {actionErr && <p className="form-error">{actionErr}</p>}

      <TxStatus
        hash={approveHook.hash || rejectHook.hash}
        isPending={approveHook.isPending || rejectHook.isPending}
        isConfirming={approveHook.receipt.isLoading || rejectHook.receipt.isLoading}
        isSuccess={approveHook.receipt.isSuccess || rejectHook.receipt.isSuccess}
        error={(approveHook.error || rejectHook.error) as Error | null}
        successMessage={approveHook.receipt.isSuccess ? 'Warranty Approved & Activated!' : 'Warranty Rejected'}
      />

      {!rejectMode ? (
        <div className={styles.actions}>
          <button
            className="btn btn--primary"
            onClick={handleApprove}
            disabled={approveHook.isPending || approveHook.receipt.isLoading}
          >
            {approveHook.isPending ? 'Approving…' : '✅ Approve Warranty'}
          </button>
          <button
            className="btn btn--danger"
            onClick={() => setRejectMode(true)}
            disabled={rejectHook.isPending || rejectHook.receipt.isLoading}
          >
            ❌ Reject
          </button>
        </div>
      ) : (
        <form onSubmit={handleReject} className={styles.rejectForm}>
          <input
            placeholder="Reason for rejection (e.g. Invalid receipt format)"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className={styles.rejectActions}>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setRejectMode(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--danger btn--sm" disabled={rejectHook.isPending}>
              {rejectHook.isPending ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

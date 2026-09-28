import { useState } from 'react'
import { useAccount } from 'wagmi'
import { keccak256, stringToHex, parseEventLogs } from 'viem'
import { Link } from 'react-router-dom'
import { useCreateWarranty, useIsIssuer } from '@/hooks/useWarranty'
import { warrantyXAbi } from '@/contracts/WarrantyX.abi'
import { DURATION_OPTIONS, parseContractError, shortAddr } from '@/utils/format'
import TxStatus from '@/components/TxStatus'
import styles from './CreateWarranty.module.css'

export default function CreateWarranty() {
  const { address, isConnected } = useAccount()
  const { data: isIssuer, isLoading: checkingIssuer } = useIsIssuer(address)
  const { createWarranty, isPending, hash, receipt, error, reset } = useCreateWarranty()

  const [form, setForm] = useState({
    productId: '',
    productName: '',
    productMetaRef: '',
    initialOwner: '',
    duration: DURATION_OPTIONS[2].seconds.toString(),
  })
  const [formError, setFormError] = useState('')

  if (!isConnected) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔒</div>
        <div className="empty-state__title">Wallet Not Connected</div>
        <p className="text-muted">Connect your wallet to issue digital warranties.</p>
      </div>
    )
  }

  if (checkingIssuer) {
    return <div className="empty-state"><span className="spinner" /></div>
  }

  if (!isIssuer) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🚫</div>
        <div className="empty-state__title">Issuer Authorization Required</div>
        <p className="text-muted" style={{ maxWidth: '480px', margin: '0.5rem auto 1.5rem auto' }}>
          This wallet address (<span className="mono">{shortAddr(address ?? '', 6)}</span>) is not an authorized warranty issuer on Bohr Testnet. Only authorized issuers can register product warranties.
        </p>
        <div className="alert alert--warn" style={{ maxWidth: '540px', margin: '0 auto', fontSize: '0.85rem', textAlign: 'left' }}>
          ⚠️ <strong>Note for Testing:</strong> The deployer wallet is authorized as an issuer by default. If you are the contract admin, you can authorize additional issuer addresses using <code>addIssuer(address)</code>.
        </div>
      </div>
    )
  }

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setFormError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!form.productId.trim()) { setFormError('Product ID is required'); return }
    if (!form.productName.trim()) { setFormError('Product name is required'); return }
    if (!form.initialOwner.match(/^0x[0-9a-fA-F]{40}$/)) { setFormError('Invalid owner address format (must be 0x...)'); return }
    if (!form.duration) { setFormError('Select a warranty duration'); return }

    try {
      const metaHash = form.productMetaRef.trim()
        ? keccak256(stringToHex(form.productMetaRef.trim()))
        : '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

      await createWarranty({
        productId: form.productId.trim(),
        productName: form.productName.trim(),
        productMetaHash: metaHash,
        productMetaRef: form.productMetaRef.trim(),
        initialOwner: form.initialOwner as `0x${string}`,
        durationSeconds: BigInt(form.duration),
      })
    } catch (err) {
      setFormError(parseContractError(err))
    }
  }

  // Parse WarrantyCreated event log if transaction confirmed
  let createdWarrantyId: bigint | undefined = undefined
  if (receipt.data) {
    try {
      const logs = parseEventLogs({
        abi: warrantyXAbi,
        eventName: 'WarrantyCreated',
        logs: receipt.data.logs,
      })
      if (logs.length > 0 && logs[0].args.warrantyId !== undefined) {
        createdWarrantyId = logs[0].args.warrantyId
      }
    } catch (err) {
      console.warn('Could not parse WarrantyCreated log:', err)
    }
  }

  const isSuccess = receipt.isSuccess

  return (
    <div className={styles.root}>
      <h1 className="section-title">➕ Issue New Warranty</h1>
      <p className="section-sub">Register a digital product warranty on Bohr Testnet. You are connected as an authorized issuer.</p>

      {/* Success Banner when WarrantyCreated event is confirmed */}
      {isSuccess && (
        <div className={`alert alert--success ${styles.successBanner}`}>
          <div className={styles.successIcon}>🎉</div>
          <div className={styles.successBody}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#22c55e', marginBottom: '0.25rem' }}>
              Warranty Created Successfully!
            </h3>
            {createdWarrantyId !== undefined && (
              <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Assigned Warranty ID: <span className="mono">#{createdWarrantyId.toString()}</span>
              </p>
            )}
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              Product: <strong>{form.productName}</strong> ({form.productId})<br />
              Owner Wallet: <span className="mono">{form.initialOwner}</span>
            </p>
            <div className={styles.successCtas}>
              {createdWarrantyId !== undefined && (
                <Link to={`/warranty/${createdWarrantyId.toString()}`} className="btn btn--primary btn--sm">
                  🔍 View Warranty Details
                </Link>
              )}
              <Link to={`/recover?owner=${form.initialOwner}`} className="btn btn--secondary btn--sm">
                🛡️ Test Recovery For Owner
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product ID / Serial Number *</label>
            <input 
              placeholder="e.g. SN-WARRANTYX-9901" 
              value={form.productId} 
              onChange={e => setField('productId', e.target.value)} 
            />
            <span className="form-hint">Unique hardware serial number or product reference code</span>
          </div>

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input 
              placeholder={'e.g. MacBook Pro 16" M3 Max'} 
              value={form.productName} 
              onChange={e => setField('productName', e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Metadata Reference (IPFS / URL)</label>
            <input 
              placeholder="ipfs://Qm... or https://..." 
              value={form.productMetaRef} 
              onChange={e => setField('productMetaRef', e.target.value)} 
            />
            <span className="form-hint">Optional reference link. A cryptographic hash of this reference is recorded on-chain.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Owner Wallet Address *</label>
            <input
              placeholder="0x..."
              value={form.initialOwner}
              onChange={e => setField('initialOwner', e.target.value)}
              className="mono"
            />
            <span className="form-hint">Address of the customer/buyer who will own and be able to recover this warranty</span>
          </div>

          <div className="form-group">
            <label className="form-label">Warranty Validity Duration *</label>
            <select value={form.duration} onChange={e => setField('duration', e.target.value)}>
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.seconds} value={opt.seconds.toString()}>{opt.label}</option>
              ))}
            </select>
          </div>

          {formError && <p className="form-error">{formError}</p>}

          <TxStatus
            hash={hash}
            isPending={isPending}
            isConfirming={receipt.isLoading}
            isSuccess={isSuccess}
            error={error as Error | null}
            onReset={reset}
            successMessage="Warranty minted on Bohr Testnet!"
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={isPending || receipt.isLoading}
            style={{ marginTop: '0.5rem' }}
          >
            {isPending || receipt.isLoading ? <><span className="spinner" /> Minting Warranty…</> : '📜 Create Warranty On-Chain'}
          </button>
        </form>

        <div className={styles.infoPanel}>
          <div className={`card ${styles.infoCard}`}>
            <h3>💡 Issuer Quick Guide</h3>
            <ul>
              <li>The created warranty is written permanently to the Bohr Testnet contract.</li>
              <li>The designated customer address immediately gains full ownership.</li>
              <li>Only authorized issuers can review claims submitted for this warranty.</li>
              <li>Duration is calculated relative to block timestamp at creation.</li>
              <li>The customer can reconnect their wallet at any time to recover this digital warranty record.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { Link } from 'react-router-dom'
import { keccak256, stringToHex } from 'viem'
import { useRegisterWarranty } from '@/hooks/useWarranty'
import { DURATION_OPTIONS, parseContractError } from '@/utils/format'
import TxStatus from '@/components/TxStatus'
import styles from './RegisterWarranty.module.css'

export default function RegisterWarranty() {
  const { address, isConnected } = useAccount()
  const { registerWarranty, isPending, hash, receipt, error, reset } = useRegisterWarranty()

  const [form, setForm] = useState({
    productId: '',
    productName: '',
    productMetaRef: '',
    proofRef: '',
    duration: DURATION_OPTIONS[2].seconds.toString(), // 2 years default
  })
  const [formError, setFormError] = useState('')

  if (!isConnected) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔒</div>
        <div className="empty-state__title">Connect Wallet to Register</div>
        <p className="text-muted">Connect your Web3 wallet to register a new product warranty and store it on-chain.</p>
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

    if (!form.productId.trim()) { setFormError('Product ID / Serial Number is required'); return }
    if (!form.productName.trim()) { setFormError('Product Name is required'); return }
    if (!form.proofRef.trim()) { setFormError('Proof of Purchase Reference is required (receipt link, order #, or IPFS URI)'); return }
    if (!form.duration) { setFormError('Select a duration'); return }

    try {
      const metaHash = form.productMetaRef.trim()
        ? keccak256(stringToHex(form.productMetaRef.trim()))
        : '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

      await registerWarranty({
        productId: form.productId.trim(),
        productName: form.productName.trim(),
        productMetaHash: metaHash,
        productMetaRef: form.productMetaRef.trim(),
        proofRef: form.proofRef.trim(),
        durationSeconds: BigInt(form.duration),
      })
    } catch (err) {
      setFormError(parseContractError(err))
    }
  }

  const isSuccess = receipt.isSuccess

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className="section-title">📝 Register Product Warranty</h1>
        <p className="section-sub">
          Submit your product details and proof of purchase to register your digital warranty on Bohr Testnet.
          Once reviewed and approved by the issuer, your warranty will be stored permanently on-chain for instant recovery anytime.
        </p>
      </div>

      <div className={styles.grid}>
        <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Serial / ID *</label>
            <input
              placeholder="e.g. SN-883920194 or IMEI/Serial"
              value={form.productId}
              onChange={e => setField('productId', e.target.value)}
              className="mono"
            />
            <span className="form-hint">Unique serial number or identifier on your physical product</span>
          </div>

          <div className="form-group">
            <label className="form-label">Product Name & Model *</label>
            <input
              placeholder="e.g. Sony WH-1000XM5 Headphones"
              value={form.productName}
              onChange={e => setField('productName', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Proof of Purchase / Receipt Ref *</label>
            <input
              placeholder="e.g. Order #INV-99210, https://store.com/receipt/123, or ipfs://..."
              value={form.proofRef}
              onChange={e => setField('proofRef', e.target.value)}
            />
            <span className="form-hint">Receipt URL, invoice number, store receipt, or IPFS link for verification</span>
          </div>

          <div className="form-group">
            <label className="form-label">Product Metadata Reference (Optional)</label>
            <input
              placeholder="ipfs://Qm... or https://..."
              value={form.productMetaRef}
              onChange={e => setField('productMetaRef', e.target.value)}
            />
            <span className="form-hint">Optional IPFS CID or specification link for product metadata</span>
          </div>

          <div className="form-group">
            <label className="form-label">Requested Warranty Duration *</label>
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
            successMessage="Warranty registration request submitted!"
          />

          {isSuccess && (
            <div className={`alert alert--success ${styles.successNotice}`}>
              <div className={styles.successIcon}>⌛</div>
              <div>
                <strong>Registration Pending Verification</strong>
                <p>
                  Your registration has been recorded on-chain! An authorized issuer will verify your proof of purchase.
                  You can track your submission status in <strong>My Warranties</strong>.
                </p>
                <Link to="/my-warranties" className="btn btn--sm btn--primary" style={{ marginTop: '0.5rem', display: 'inline-block', textDecoration: 'none' }}>
                  Go to My Warranties →
                </Link>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={isPending || receipt.isLoading}
          >
            {isPending || receipt.isLoading ? <><span className="spinner" /> Submitting Request…</> : '📝 Submit Warranty Registration'}
          </button>
        </form>

        <div className={styles.infoPanel}>
          <div className={`card ${styles.infoCard}`}>
            <h3>🛡️ How Registration Works</h3>
            <ol className={styles.stepsList}>
              <li>
                <strong>1. Submit Registration</strong>
                <p>Enter your product serial number, description, and proof of purchase (receipt URL or order reference).</p>
              </li>
              <li>
                <strong>2. On-Chain Pending Status</strong>
                <p>Your request is recorded directly on Bohr Testnet with <em>Pending Verification</em> status.</p>
              </li>
              <li>
                <strong>3. Issuer Verification</strong>
                <p>The authorized brand or store issuer reviews your proof of purchase for validity.</p>
              </li>
              <li>
                <strong>4. Permanent On-Chain Record</strong>
                <p>Once approved, your warranty becomes active and permanently bound to your wallet address for future recovery.</p>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}


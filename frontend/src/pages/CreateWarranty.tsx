import { useState } from 'react'
import { useAccount } from 'wagmi'
import { keccak256, stringToHex } from 'viem'
import { useCreateWarranty, useIsIssuer } from '@/hooks/useWarranty'
import { DURATION_OPTIONS, parseContractError } from '@/utils/format'
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
        <div className="empty-state__title">Connect Wallet</div>
        <p className="text-muted">Connect your wallet to create warranties.</p>
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
        <div className="empty-state__title">Not Authorized</div>
        <p className="text-muted">Only authorized warranty issuers can create warranties. Ask the contract owner to grant you issuer access.</p>
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
    if (!form.initialOwner.match(/^0x[0-9a-fA-F]{40}$/)) { setFormError('Invalid owner address'); return }
    if (!form.duration) { setFormError('Select a duration'); return }

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

  const isSuccess = receipt.isSuccess

  return (
    <div className={styles.root}>
      <h1 className="section-title">➕ Create Warranty</h1>
      <p className="section-sub">Issue a new digital warranty on Bohr Testnet. You are an authorized issuer.</p>

      <div className={styles.grid}>
        <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product ID *</label>
            <input placeholder="e.g. SN-12345678" value={form.productId} onChange={e => setField('productId', e.target.value)} />
            <span className="form-hint">Unique serial number or product code</span>
          </div>

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input placeholder={'e.g. Samsung 65" QLED TV'} value={form.productName} onChange={e => setField('productName', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Product Metadata Reference</label>
            <input placeholder="ipfs://Qm... or https://..." value={form.productMetaRef} onChange={e => setField('productMetaRef', e.target.value)} />
            <span className="form-hint">Optional IPFS CID or URL with product details. A hash of this is stored on-chain.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Owner Address *</label>
            <input
              placeholder="0x..."
              value={form.initialOwner}
              onChange={e => setField('initialOwner', e.target.value)}
              className="mono"
            />
            <span className="form-hint">Wallet address of the product buyer</span>
          </div>

          <div className="form-group">
            <label className="form-label">Warranty Duration *</label>
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
            successMessage="Warranty created successfully!"
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={isPending || receipt.isLoading}
          >
            {isPending || receipt.isLoading ? <><span className="spinner" /> Creating…</> : '📜 Create Warranty'}
          </button>
        </form>

        <div className={styles.infoPanel}>
          <div className={`card ${styles.infoCard}`}>
            <h3>💡 About Warranty Creation</h3>
            <ul>
              <li>The warranty is minted on Bohr Testnet and permanently linked to the product ID.</li>
              <li>The initial owner receives immediate ownership of the warranty.</li>
              <li>Only you (the issuer) can review claims on warranties you issue.</li>
              <li>The warranty duration starts from the time of creation.</li>
              <li>Product metadata is referenced by hash — store documents on IPFS.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

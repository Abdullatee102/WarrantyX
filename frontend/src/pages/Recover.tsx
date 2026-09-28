import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useSearchParams, Link } from 'react-router-dom'
import { isAddress } from 'viem'
import { appkitModal } from '@/config/appkit'
import { useWarrantiesByOwner, useWarranty } from '@/hooks/useWarranty'
import { WarrantyStatus } from '@/types/warranty'
import { warrantyStatusLabel, warrantyStatusClass, shortAddr, formatDate, timeUntil } from '@/utils/format'
import styles from './Recover.module.css'

export default function Recover() {
  const { address: connectedAddress, isConnected } = useAccount()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const queryOwner = searchParams.get('owner') ?? ''
  const [inputOwner, setInputOwner] = useState(queryOwner)
  const [targetAddress, setTargetAddress] = useState<`0x${string}` | undefined>(
    isAddress(queryOwner) ? (queryOwner as `0x${string}`) : connectedAddress
  )
  const [isScanning, setIsScanning] = useState(false)

  // Update target address when connected address changes (if no manual URL param)
  useEffect(() => {
    if (!queryOwner && connectedAddress) {
      setTargetAddress(connectedAddress)
      setInputOwner(connectedAddress)
    }
  }, [connectedAddress, queryOwner])

  const handleConnectClick = () => {
    appkitModal.open()
  }

  const handleScanClick = () => {
    setIsScanning(true)
    setTimeout(() => setIsScanning(false), 600)
  }

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputOwner.trim()) {
      setTargetAddress(connectedAddress)
      setSearchParams({})
      return
    }
    if (isAddress(inputOwner.trim())) {
      const addr = inputOwner.trim() as `0x${string}`
      setTargetAddress(addr)
      setSearchParams({ owner: addr })
      handleScanClick()
    }
  }

  const isTestingOtherWallet = targetAddress && connectedAddress && targetAddress.toLowerCase() !== connectedAddress.toLowerCase()

  return (
    <div className={styles.root}>
      {/* Hero Banner */}
      <section className={styles.heroCard}>
        <div className={styles.heroBadge}>🛡️ On-Chain Lost-Warranty Recovery</div>
        <h1 className={styles.heroTitle}>
          Lost Your Warranty?<br />
          <span className={styles.heroAccent}>Recover It From the Blockchain.</span>
        </h1>
        <p className={styles.heroDesc}>
          Physical warranty cards and receipts get lost or damaged over time.
          Your digital warranty record remains permanently accessible and recoverable on the Bohr Testnet blockchain.
        </p>

        <div className={styles.ctaBox}>
          {!isConnected && !targetAddress ? (
            <button className="btn btn--primary btn--lg" onClick={handleConnectClick}>
              🛡️ Connect Wallet to Recover Warranties
            </button>
          ) : (
            <button className="btn btn--primary btn--lg" onClick={handleScanClick} disabled={isScanning}>
              {isScanning ? (
                <><span className="spinner" /> Scanning Blockchain...</>
              ) : (
                '🔍 Run Recovery Scanner'
              )}
            </button>
          )}
        </div>
      </section>

      {/* Manual / Testing Owner Address Lookup Box */}
      <section className="card">
        <form onSubmit={handleManualSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="form-label" style={{ fontWeight: 700 }}>
            🔎 Recovery Wallet Address Lookup (Scan Target Wallet)
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              placeholder="Enter owner wallet address (0x...)"
              value={inputOwner}
              onChange={e => setInputOwner(e.target.value)}
              className="mono"
              style={{ flex: 1, minWidth: '240px' }}
            />
            <button type="submit" className="btn btn--secondary">
              Scan Address
            </button>
            {connectedAddress && (
              <button 
                type="button" 
                className="btn btn--secondary" 
                onClick={() => {
                  setInputOwner(connectedAddress)
                  setTargetAddress(connectedAddress)
                  setSearchParams({})
                  handleScanClick()
                }}
              >
                Use Connected Wallet
              </button>
            )}
          </div>
          <span className="form-hint">
            Query <code>getWarrantiesByOwner(address)</code> directly on Bohr Testnet. Defaults to your connected wallet.
          </span>
        </form>
      </section>

      {/* Recovery Results Section */}
      <section className={styles.resultsSection}>
        {!targetAddress ? (
          <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Wallet Connection Required</h3>
            <p className="text-muted" style={{ maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              Connect your wallet or enter an owner address above to discover and recover digital warranty records.
            </p>
            <button className="btn btn--primary" onClick={handleConnectClick}>
              Connect Wallet Now
            </button>
          </div>
        ) : (
          <RecoveryResults 
            address={targetAddress} 
            isScanning={isScanning} 
            isTestingOtherWallet={Boolean(isTestingOtherWallet)} 
          />
        )}
      </section>

      {/* Educational Recovery FAQs */}
      <section className={styles.faqGrid}>
        <div className={`card ${styles.faqCard}`}>
          <h4>💡 How does Warranty Recovery work?</h4>
          <p>
            When a warranty is registered on-chain, it is linked directly to your wallet address.
            Even if you lose your physical receipt, reconnecting your wallet lets WarrantyX discover and recover your digital warranty record.
          </p>
        </div>

        <div className={`card ${styles.faqCard}`}>
          <h4>🔐 Is my recovery secure?</h4>
          <p>
            Yes. Warranty ownership is cryptographically enforced on Bohr Testnet. Only the owner wallet recorded on-chain can manage or submit claims for the warranty.
          </p>
        </div>

        <div className={`card ${styles.faqCard}`}>
          <h4>↔️ What if the product was resold?</h4>
          <p>
            When a product is resold and its warranty transferred on-chain, the new owner's wallet automatically recovers the warranty when they run the scanner.
          </p>
        </div>
      </section>
    </div>
  )
}

function RecoveryResults({ 
  address, 
  isScanning,
  isTestingOtherWallet,
}: { 
  address: `0x${string}`
  isScanning: boolean
  isTestingOtherWallet: boolean
}) {
  const { data: ids, isLoading } = useWarrantiesByOwner(address)

  if (isLoading || isScanning) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <span className="spinner" style={{ width: '32px', height: '32px', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Querying Blockchain...</h3>
        <p className="text-muted">
          Reading <code>getWarrantiesByOwner</code> for target wallet address <span className="mono">{shortAddr(address, 8)}</span> on Bohr Testnet.
        </p>
      </div>
    )
  }

  if (!ids || ids.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Registered Warranties Found</h3>
        <p className="text-muted" style={{ maxWidth: '520px', margin: '0 auto 1rem auto', lineHeight: 1.6 }}>
          No on-chain warranty records were found for target wallet address <span className="mono">{shortAddr(address, 8)}</span>.
        </p>
        <div className="alert alert--info" style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'left', fontSize: '0.85rem' }}>
          ℹ️ <strong>Note on Recovery:</strong> Recovery discovers warranties that were previously registered on-chain and assigned to this wallet address. If the warranty was issued to a different address, please enter or switch to that wallet.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.recoveredContainer}>
      <div className={styles.recoveredHeader}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Digital Warranties Recovered</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Found {ids.length} digital warranty record{ids.length > 1 ? 's' : ''} linked to owner address <span className="mono">{shortAddr(address, 8)}</span>.
          </p>
        </div>
        <span className="badge badge--active">✓ On-Chain Verified ({ids.length})</span>
      </div>

      {isTestingOtherWallet && (
        <div className="alert alert--info" style={{ fontSize: '0.85rem' }}>
          🔍 Viewing recovered warranties for owner wallet address <span className="mono">{address}</span>.
        </div>
      )}

      <div className={styles.grid}>
        {ids.map(id => (
          <RecoveredWarrantyItem key={id.toString()} warrantyId={id} />
        ))}
      </div>
    </div>
  )
}

function RecoveredWarrantyItem({ warrantyId }: { warrantyId: bigint }) {
  const { data: warranty, isLoading } = useWarranty(warrantyId)

  if (isLoading || !warranty) {
    return (
      <div className="card text-center" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" />
      </div>
    )
  }

  const expiredByTime = BigInt(Math.floor(Date.now() / 1000)) >= warranty.expiresAt
  const effectiveStatus = expiredByTime && warranty.status === WarrantyStatus.Active ? 4 : warranty.status
  const isActive = warranty.status === WarrantyStatus.Active && !expiredByTime

  return (
    <div className={`card card--hover ${styles.itemCard}`}>
      <div className={styles.itemHeader}>
        <div className={styles.itemMeta}>
          <span className={styles.recoveredTag}>Digital Record Recovered</span>
          <span className={styles.idBadge}>#{warranty.warrantyId.toString()}</span>
        </div>
        <span className={`badge ${warrantyStatusClass(effectiveStatus)}`}>
          {warrantyStatusLabel(effectiveStatus)}
        </span>
      </div>

      <h3 className={styles.productName}>{warranty.productName}</h3>
      <div className={styles.productId}>Serial / Product ID: <span className="mono">{warranty.productId}</span></div>

      <div className={styles.detailsGrid}>
        <div>
          <span className={styles.detailLabel}>Issued On</span>
          <span className={styles.detailVal}>{formatDate(warranty.issuedAt)}</span>
        </div>
        <div>
          <span className={styles.detailLabel}>Expiration Date</span>
          <span className={`${styles.detailVal} ${expiredByTime ? 'text-danger' : ''}`}>{formatDate(warranty.expiresAt)}</span>
        </div>
        <div>
          <span className={styles.detailLabel}>Validity Status</span>
          <span className={`${styles.detailVal} ${expiredByTime ? 'text-danger' : 'text-accent'}`}>{timeUntil(warranty.expiresAt)}</span>
        </div>
        <div>
          <span className={styles.detailLabel}>Issuer</span>
          <span className={`${styles.detailVal} addr`}>{shortAddr(warranty.issuer, 6)}</span>
        </div>
      </div>

      <div className={styles.itemFooter}>
        <Link to={`/warranty/${warranty.warrantyId.toString()}`} className="btn btn--primary btn--sm">
          🔍 View Full Warranty Details
        </Link>
        {isActive && (
          <Link to={`/warranty/${warrantyId.toString()}`} className="btn btn--secondary btn--sm">
            📋 Submit Claim
          </Link>
        )}
      </div>
    </div>
  )
}

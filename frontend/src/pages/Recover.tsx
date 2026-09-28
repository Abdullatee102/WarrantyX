import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { Link } from 'react-router-dom'
import { useWarrantiesByOwner, useWarranty } from '@/hooks/useWarranty'
import { WarrantyStatus } from '@/types/warranty'
import { warrantyStatusLabel, warrantyStatusClass, shortAddr, formatDate, timeUntil } from '@/utils/format'
import styles from './Recover.module.css'

export default function Recover() {
  const { address, isConnected } = useAccount()
  const { open } = useAppKit()
  const [isScanning, setIsScanning] = useState(false)

  const handleConnectClick = () => {
    open()
  }

  const handleScanClick = () => {
    setIsScanning(true)
    setTimeout(() => setIsScanning(false), 800)
  }

  return (
    <div className={styles.root}>
      {/* Hero Banner */}
      <section className={styles.heroCard}>
        <div className={styles.heroBadge}>🛡️ Blockchain Recovery Service</div>
        <h1 className={styles.heroTitle}>
          Lost Your Warranty?<br />
          <span className={styles.heroAccent}>Recover It From the Blockchain.</span>
        </h1>
        <p className={styles.heroDesc}>
          Your physical warranty card, receipt, or paperwork may be lost or damaged.
          Your digital warranty record remains permanently accessible and verifiable on-chain.
        </p>

        <div className={styles.ctaBox}>
          {!isConnected ? (
            <button className="btn btn--primary btn--lg" onClick={handleConnectClick}>
              🛡️ Connect Wallet to Recover Warranty
            </button>
          ) : (
            <button className="btn btn--primary btn--lg" onClick={handleScanClick} disabled={isScanning}>
              {isScanning ? (
                <><span className="spinner" /> Scanning Blockchain...</>
              ) : (
                '🔍 Scan Wallet & Recover Warranties'
              )}
            </button>
          )}
        </div>
      </section>

      {/* Recovery Results Section */}
      <section className={styles.resultsSection}>
        {!isConnected ? (
          <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Wallet Connection Required</h3>
            <p className="text-muted" style={{ maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              Connect the wallet that was previously registered to your product purchase to discover and recover your digital warranty records.
            </p>
            <button className="btn btn--primary" onClick={handleConnectClick}>
              Connect Wallet Now
            </button>
          </div>
        ) : (
          <RecoveryResults address={address!} isScanning={isScanning} />
        )}
      </section>

      {/* Educational Recovery FAQs */}
      <section className={styles.faqGrid}>
        <div className={`card ${styles.faqCard}`}>
          <h4>💡 How does Warranty Recovery work?</h4>
          <p>
            When a product warranty is issued on WarrantyX, it is linked on-chain to your wallet address.
            Even if you lose your receipt, you can reconnect your wallet to automatically discover and recover your digital warranty card.
          </p>
        </div>

        <div className={`card ${styles.faqCard}`}>
          <h4>🔐 Is my recovery secure?</h4>
          <p>
            Yes. Warranty ownership is cryptographic. Only the wallet holding ownership rights can access, manage, or transfer the warranty. No central authority can erase your record.
          </p>
        </div>

        <div className={`card ${styles.faqCard}`}>
          <h4>↔️ What if I resold the product?</h4>
          <p>
            If you transferred ownership of the warranty on-chain to a buyer, the warranty will now appear under the buyer's wallet when they run the recovery scanner.
          </p>
        </div>
      </section>
    </div>
  )
}

function RecoveryResults({ address, isScanning }: { address: `0x${string}`; isScanning: boolean }) {
  const { data: ids, isLoading } = useWarrantiesByOwner(address)

  if (isLoading || isScanning) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <span className="spinner" style={{ width: '32px', height: '32px', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Finding your warranties...</h3>
        <p className="text-muted">
          Please wait while we query the Bohr Testnet blockchain for warranty records associated with your wallet address <span className="mono">{shortAddr(address, 6)}</span>.
        </p>
      </div>
    )
  }

  if (!ids || ids.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No WarrantyX Warranties Found</h3>
        <p className="text-muted" style={{ maxWidth: '520px', margin: '0 auto 1rem auto', lineHeight: 1.6 }}>
          No on-chain warranty records were found for wallet address <span className="mono">{shortAddr(address, 6)}</span>.
        </p>
        <div className="alert alert--info" style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'left', fontSize: '0.85rem' }}>
          ℹ️ <strong>Note on Recovery:</strong> Recovery works for digital warranties that were previously issued or transferred to this wallet address. If your product was registered under another wallet, please switch wallets in your browser.
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
            Found {ids.length} digital warranty record{ids.length > 1 ? 's' : ''} linked to your connected wallet.
          </p>
        </div>
        <span className="badge badge--active">✓ On-Chain Verified</span>
      </div>

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
          <Link to={`/warranty/${warranty.warrantyId.toString()}`} className="btn btn--secondary btn--sm">
            📋 Submit Claim
          </Link>
        )}
      </div>
    </div>
  )
}

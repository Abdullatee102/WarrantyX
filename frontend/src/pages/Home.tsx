import React from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { appkitModal } from '@/config/appkit'
import { usePlatformStats } from '@/hooks/useWarranty'
import { CONTRACT_ADDRESS, explorerAddr } from '@/config/chains'
import styles from './Home.module.css'

export default function Home() {
  const { isConnected } = useAccount()
  const { data: stats, isLoading } = usePlatformStats()

  const handleOpenConnect = () => {
    appkitModal.open()
  }

  return (
    <div className={styles.root}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          🛡️ Blockchain Lost-Warranty Recovery Platform
        </div>
        <h1 className={styles.heroTitle}>
          Lost Your Warranty?<br />
          <span className={styles.heroAccent}>Recover It From the Blockchain.</span>
        </h1>
        <p className={styles.heroSub}>
          Your physical warranty card or receipt may be lost or misplaced.
          Register your warranty digitally and recover your permanent record on-chain anytime.
        </p>
        <div className={styles.heroCtas}>
          {isConnected ? (
            <Link to="/recover" className="btn btn--primary btn--lg">
              🛡️ Recover My Warranty
            </Link>
          ) : (
            <button className="btn btn--primary btn--lg" onClick={handleOpenConnect}>
              🛡️ Recover My Warranty
            </button>
          )}
          <Link to="/register" className="btn btn--secondary btn--lg">
            📝 Register a Warranty
          </Link>
          <Link to="/verify" className="btn btn--secondary btn--lg">
            🔍 Verify
          </Link>
        </div>
      </section>

      {/* Primary Value Proposition / Recovery Problem & Solution */}
      <section className={styles.problemSolution}>
        <div className={`card ${styles.psCard}`}>
          <div className={styles.psIcon}>📄</div>
          <h3>The Problem</h3>
          <p>
            Physical receipts fade, warranty cards get lost, and resold items rarely come with transferrable proof of warranty.
          </p>
        </div>
        <div className={`card ${styles.psCard} ${styles.psCardHighlight}`}>
          <div className={styles.psIcon}>⛓️</div>
          <h3>The WarrantyX Solution</h3>
          <p>
            Users register their warranty details and proof of purchase on Bohr Testnet. Once verified by the issuer, digital warranties are stored on-chain for lifetime recovery.
          </p>
        </div>
        <div className={`card ${styles.psCard}`}>
          <div className={styles.psIcon}>↔️</div>
          <h3>Resell & Transfer</h3>
          <p>
            Selling a product? Transfer the warranty on-chain to the new owner so they can recover and claim it seamlessly.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <StatCard
          icon="🛡️"
          label="Active Warranties"
          value={isLoading ? '—' : (stats?.warranties ?? 0n).toString()}
        />
        <StatCard
          icon="📝"
          label="User Registrations"
          value={isLoading ? '—' : (stats?.registrations ?? 0n).toString()}
        />
        <StatCard
          icon="↔️"
          label="Ownership Transfers"
          value={isLoading ? '—' : (stats?.transfers ?? 0n).toString()}
        />
        <StatCard
          icon="📋"
          label="Claims Submitted"
          value={isLoading ? '—' : (stats?.claims ?? 0n).toString()}
        />
      </section>

      {/* How it works */}
      <section className={styles.howSection}>
        <h2 className={styles.sectionTitle}>How Warranty Registration & Recovery Works</h2>
        <div className={styles.steps}>
          <Step 
            n="1" 
            title="Register Product Warranty" 
            body="Product owners submit their product serial number, description, and proof of purchase to create an on-chain registration request." 
          />
          <Step 
            n="2" 
            title="Issuer Verification" 
            body="Authorized brand or retail issuers review the submission proof on-chain and approve the registration into an Active Warranty." 
          />
          <Step 
            n="3" 
            title="Recover Anytime" 
            body="If your physical receipt or paper card is misplaced, reconnect your wallet to instantly recover your verified digital warranty." 
          />
          <Step 
            n="4" 
            title="Transfer & Defect Claims" 
            body="Transfer ownership when reselling products, or submit warranty defect claims directly to the issuer on-chain." 
          />
        </div>
      </section>

      {/* Network info */}
      <section className={styles.networkSection}>
        <div className={styles.networkCard}>
          <h3>⛓️ Live Protocol on Bohr Testnet</h3>
          <div className={styles.networkGrid}>
            <div><span className={styles.netLabel}>Network</span><span>Bohr Testnet</span></div>
            <div><span className={styles.netLabel}>Chain ID</span><span>968</span></div>
            <div><span className={styles.netLabel}>Native Token</span><span>BOT</span></div>
            <div>
              <span className={styles.netLabel}>Contract Address (CA)</span>
              <a href={explorerAddr(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer" className="mono">
                {CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-6)}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className={`card ${styles.statCard}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className={styles.step}>
      <div className={styles.stepNum}>{n}</div>
      <h4 className={styles.stepTitle}>{title}</h4>
      <p className={styles.stepBody}>{body}</p>
    </div>
  )
}

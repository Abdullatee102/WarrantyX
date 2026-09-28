import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAccount } from 'wagmi'
import styles from './Layout.module.css'
import NetworkGuard from './NetworkGuard'
import WalletConnect from './WalletConnect'

export default function Layout() {
  const { isConnected } = useAccount()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const toggleMobileNav = () => setMobileNavOpen(prev => !prev)
  const closeMobileNav = () => setMobileNavOpen(false)

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerTop}>
            <NavLink to="/" className={styles.logo} onClick={closeMobileNav}>
              <span className={styles.logoIcon}>🛡️</span>
              <span className={styles.logoText}>WarrantyX</span>
              <span className={styles.logoBadge}>Bohr Testnet</span>
            </NavLink>

            <div className={styles.headerRight}>
              <WalletConnect />
              <button 
                className={styles.mobileMenuBtn} 
                onClick={toggleMobileNav}
                aria-label="Toggle Navigation Menu"
              >
                {mobileNavOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          <nav className={`${styles.nav} ${mobileNavOpen ? styles.navOpen : ''}`}>
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
              onClick={closeMobileNav}
            >
              🏠 Home
            </NavLink>

            <NavLink 
              to="/recover" 
              className={({ isActive }) => `${styles.navLink} ${styles.navHighlight} ${isActive ? styles.navActive : ''}`}
              onClick={closeMobileNav}
            >
              🛡️ Recover Warranty
            </NavLink>

            {isConnected && (
              <NavLink 
                to="/my-warranties" 
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
                onClick={closeMobileNav}
              >
                📋 My Warranties
              </NavLink>
            )}

            <NavLink 
              to="/verify" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
              onClick={closeMobileNav}
            >
              🔍 Verify
            </NavLink>

            {isConnected && (
              <NavLink 
                to="/create" 
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
                onClick={closeMobileNav}
              >
                ➕ Issue Warranty
              </NavLink>
            )}

            <NavLink 
              to="/activity" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
              onClick={closeMobileNav}
            >
              📡 Activity
            </NavLink>

            {isConnected && (
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
                onClick={closeMobileNav}
              >
                👤 Profile
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <NetworkGuard>
          <Outlet />
        </NetworkGuard>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>
            WarrantyX · Blockchain-based Lost Warranty Recovery Platform on{' '}
            <a href="https://scan.bohr.life" target="_blank" rel="noopener noreferrer">Bohr Testnet (Chain 968)</a>
          </p>
          <p className={styles.contractRef}>
            Contract CA: <a href="https://scan.bohr.life/address/0x3EEd2A5a337A8c954276049d2FBD490655B55f31" target="_blank" rel="noopener noreferrer" className="mono">0x3EEd2A5a337A8c954276049d2FBD490655B55f31</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

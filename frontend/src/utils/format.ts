// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers — WarrantyX
// ─────────────────────────────────────────────────────────────────────────────
import { WarrantyStatus, ClaimStatus } from '@/types/warranty'

// ── Address formatting ────────────────────────────────────────────────────────
export function shortAddr(addr: string, chars = 6): string {
  if (!addr || addr.length < chars * 2) return addr
  return `${addr.slice(0, chars)}...${addr.slice(-4)}`
}

// ── Timestamp formatting ──────────────────────────────────────────────────────
export function formatDate(ts: bigint | number): string {
  if (!ts || ts === 0n) return 'N/A'
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000
  return new Date(ms).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(ts: bigint | number): string {
  if (!ts || ts === 0n) return 'N/A'
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000
  return new Date(ms).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeUntil(ts: bigint | number): string {
  if (!ts || ts === 0n) return 'Pending Verification'
  const nowS  = Math.floor(Date.now() / 1000)
  const expS  = typeof ts === 'bigint' ? Number(ts) : ts
  const diff  = expS - nowS
  if (diff <= 0) return 'Expired'
  const days  = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  if (days > 0) return `${days}d ${hours}h remaining`
  const mins  = Math.floor((diff % 3600) / 60)
  return `${hours}h ${mins}m remaining`
}

// ── Warranty status helpers ───────────────────────────────────────────────────
export function warrantyStatusLabel(status: number): string {
  switch (status) {
    case WarrantyStatus.Pending:       return 'Pending Verification'
    case WarrantyStatus.Active:        return 'Active'
    case WarrantyStatus.Rejected:      return 'Registration Rejected'
    case WarrantyStatus.ClaimPending:  return 'Claim Pending'
    case WarrantyStatus.ClaimApproved: return 'Claim Approved'
    case WarrantyStatus.ClaimRejected: return 'Claim Rejected'
    case WarrantyStatus.Expired:       return 'Expired'
    case WarrantyStatus.Cancelled:     return 'Cancelled'
    default:                           return 'Unknown'
  }
}

export function warrantyStatusClass(status: number): string {
  switch (status) {
    case WarrantyStatus.Pending:       return 'badge--pending'
    case WarrantyStatus.Active:        return 'badge--active'
    case WarrantyStatus.Rejected:      return 'badge--rejected'
    case WarrantyStatus.ClaimPending:  return 'badge--pending'
    case WarrantyStatus.ClaimApproved: return 'badge--approved'
    case WarrantyStatus.ClaimRejected: return 'badge--rejected'
    case WarrantyStatus.Expired:       return 'badge--expired'
    case WarrantyStatus.Cancelled:     return 'badge--cancelled'
    default:                           return 'badge--default'
  }
}

// ── Claim status helpers ──────────────────────────────────────────────────────
export function claimStatusLabel(status: number): string {
  switch (status) {
    case ClaimStatus.Pending:  return 'Pending'
    case ClaimStatus.Approved: return 'Approved'
    case ClaimStatus.Rejected: return 'Rejected'
    default:                   return 'Unknown'
  }
}

export function claimStatusClass(status: number): string {
  switch (status) {
    case ClaimStatus.Pending:  return 'badge--pending'
    case ClaimStatus.Approved: return 'badge--approved'
    case ClaimStatus.Rejected: return 'badge--rejected'
    default:                   return 'badge--default'
  }
}

// ── Warranty state checks ─────────────────────────────────────────────────────
export function isEffectivelyActive(status: number, expiresAt: bigint): boolean {
  const nowS = BigInt(Math.floor(Date.now() / 1000))
  return status === WarrantyStatus.Active && expiresAt > nowS
}

export function isEffectivelyExpired(status: number, expiresAt: bigint): boolean {
  if (status === WarrantyStatus.Pending || status === WarrantyStatus.Rejected) return false
  const nowS = BigInt(Math.floor(Date.now() / 1000))
  return status === WarrantyStatus.Expired || (expiresAt > 0n && expiresAt <= nowS)
}

// ── Error parsing ─────────────────────────────────────────────────────────────
export function parseContractError(err: unknown): string {
  if (!err) return 'Unknown error'
  const msg = String(err)

  if (msg.includes('User rejected') || msg.includes('user rejected'))
    return 'Transaction rejected by user'
  if (msg.includes('not authorized issuer'))
    return 'You are not an authorized warranty issuer'
  if (msg.includes('not warranty owner'))
    return 'You are not the warranty owner'
  if (msg.includes('warranty expired'))
    return 'This warranty has expired'
  if (msg.includes('warranty not pending'))
    return 'This warranty registration is not in pending status'
  if (msg.includes('claim pending'))
    return 'A claim is already pending review'
  if (msg.includes('no pending claim'))
    return 'No pending claim found'
  if (msg.includes('already reviewed'))
    return 'This claim has already been reviewed'
  if (msg.includes('warranty not active'))
    return 'Warranty is not in an active state'
  if (msg.includes('warranty does not exist'))
    return 'Warranty not found'
  if (msg.includes('zero owner') || msg.includes('zero address'))
    return 'Invalid address — cannot use zero address'
  if (msg.includes('Insufficient funds') || msg.includes('insufficient funds'))
    return 'Insufficient BOT balance for transaction'
  if (msg.includes('already cancelled'))
    return 'Warranty is already cancelled'
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error — check your RPC connection'

  if (msg.length > 120) return msg.slice(0, 120) + '…'
  return msg
}

// ── Duration helpers ──────────────────────────────────────────────────────────
export const DURATION_OPTIONS = [
  { label: '3 months',  seconds: 90  * 24 * 3600 },
  { label: '6 months',  seconds: 180 * 24 * 3600 },
  { label: '1 year',    seconds: 365 * 24 * 3600 },
  { label: '2 years',   seconds: 730 * 24 * 3600 },
  { label: '3 years',   seconds: 1095 * 24 * 3600 },
  { label: '5 years',   seconds: 1825 * 24 * 3600 },
]

// ─────────────────────────────────────────────────────────────────────────────
// WarrantyX — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors WarrantyX.WarrantyStatus enum in the contract */
export enum WarrantyStatus {
  Active = 0,
  ClaimPending = 1,
  ClaimApproved = 2,
  ClaimRejected = 3,
  Expired = 4,
  Cancelled = 5,
}

/** Mirrors WarrantyX.ClaimStatus enum in the contract */
export enum ClaimStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

/** On-chain Warranty struct */
export interface Warranty {
  warrantyId: bigint
  productId: string
  productName: string
  productMetaHash: `0x${string}`
  productMetaRef: string
  issuer: `0x${string}`
  owner: `0x${string}`
  issuedAt: bigint
  expiresAt: bigint
  status: number
  transferCount: bigint
  claimCount: bigint
  approvedClaimCount: bigint
  rejectedClaimCount: bigint
  lastClaimAt: bigint
}

/** On-chain Claim struct */
export interface Claim {
  claimId: bigint
  claimant: `0x${string}`
  description: string
  metadataHash: `0x${string}`
  documentRef: string
  submittedAt: bigint
  status: number
  reviewer: `0x${string}`
  reviewedAt: bigint
}

/** On-chain TransferRecord struct */
export interface TransferRecord {
  from: `0x${string}`
  to: `0x${string}`
  timestamp: bigint
}

/** Platform statistics */
export interface PlatformStats {
  warranties: bigint
  transfers: bigint
  claims: bigint
  approvedClaims: bigint
}


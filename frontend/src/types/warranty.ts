// ─────────────────────────────────────────────────────────────────────────────
// WarrantyX — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors WarrantyX.WarrantyStatus enum in the contract */
export enum WarrantyStatus {
  Pending = 0,        // Submitted by user, awaiting issuer verification
  Active = 1,         // Verified & approved by issuer; active warranty
  Rejected = 2,       // Registration rejected by issuer
  ClaimPending = 3,   // Defect claim submitted, awaiting review
  ClaimApproved = 4,  // Defect claim approved
  ClaimRejected = 5,  // Defect claim rejected
  Expired = 6,        // Warranty duration expired
  Cancelled = 7,      // Cancelled by issuer
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
  proofRef: string
  issuer: `0x${string}`
  owner: `0x${string}`
  submittedAt: bigint
  issuedAt: bigint
  expiresAt: bigint
  durationSeconds: bigint
  status: number
  rejectionReason: string
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
  registrations: bigint
  approved: bigint
  rejected: bigint
  transfers: bigint
  claims: bigint
  approvedClaims: bigint
}

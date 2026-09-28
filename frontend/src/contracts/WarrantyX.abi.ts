// ─────────────────────────────────────────────────────────────────────────────
// WarrantyX ABI — User Registration, Verification, Recovery, Claims, Transfers
// Deployed at: 0x97CD5C9B7267c83820e96DAD9ea8F56c65721920 (Bohr Testnet, Chain 968)
// ─────────────────────────────────────────────────────────────────────────────

export const warrantyXAbi = [
  // ── Functions ──────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'registerWarranty',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'productId', type: 'string' },
      { name: 'productName', type: 'string' },
      { name: 'productMetaHash', type: 'bytes32' },
      { name: 'productMetaRef', type: 'string' },
      { name: 'proofRef', type: 'string' },
      { name: 'durationSeconds', type: 'uint256' },
    ],
    outputs: [{ name: 'warrantyId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approveWarranty',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'warrantyId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'rejectWarranty',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'warrantyId', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'createWarranty',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'productId', type: 'string' },
      { name: 'productName', type: 'string' },
      { name: 'productMetaHash', type: 'bytes32' },
      { name: 'productMetaRef', type: 'string' },
      { name: 'initialOwner', type: 'address' },
      { name: 'durationSeconds', type: 'uint256' },
    ],
    outputs: [{ name: 'warrantyId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transferWarranty',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'warrantyId', type: 'uint256' },
      { name: 'newOwner', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'submitClaim',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'warrantyId', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'metadataHash', type: 'bytes32' },
      { name: 'documentRef', type: 'string' },
    ],
    outputs: [{ name: 'claimId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'reviewClaim',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'warrantyId', type: 'uint256' },
      { name: 'approve', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'cancelWarranty',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'warrantyId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addIssuer',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'issuer', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeIssuer',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'issuer', type: 'address' }],
    outputs: [],
  },

  // ── Views ──────────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'getWarranty',
    stateMutability: 'view',
    inputs: [{ name: 'warrantyId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'warrantyId', type: 'uint256' },
          { name: 'productId', type: 'string' },
          { name: 'productName', type: 'string' },
          { name: 'productMetaHash', type: 'bytes32' },
          { name: 'productMetaRef', type: 'string' },
          { name: 'proofRef', type: 'string' },
          { name: 'issuer', type: 'address' },
          { name: 'owner', type: 'address' },
          { name: 'submittedAt', type: 'uint256' },
          { name: 'issuedAt', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' },
          { name: 'durationSeconds', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'rejectionReason', type: 'string' },
          { name: 'transferCount', type: 'uint256' },
          { name: 'claimCount', type: 'uint256' },
          { name: 'approvedClaimCount', type: 'uint256' },
          { name: 'rejectedClaimCount', type: 'uint256' },
          { name: 'lastClaimAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'isWarrantyValid',
    stateMutability: 'view',
    inputs: [{ name: 'warrantyId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getWarrantyOwner',
    stateMutability: 'view',
    inputs: [{ name: 'warrantyId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'getTotalWarranties',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getTransferHistory',
    stateMutability: 'view',
    inputs: [{ name: 'warrantyId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getClaims',
    stateMutability: 'view',
    inputs: [{ name: 'warrantyId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'claimId', type: 'uint256' },
          { name: 'claimant', type: 'address' },
          { name: 'description', type: 'string' },
          { name: 'metadataHash', type: 'bytes32' },
          { name: 'documentRef', type: 'string' },
          { name: 'submittedAt', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'reviewer', type: 'address' },
          { name: 'reviewedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getClaim',
    stateMutability: 'view',
    inputs: [
      { name: 'warrantyId', type: 'uint256' },
      { name: 'claimIndex', type: 'uint256' },
    ],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'claimId', type: 'uint256' },
          { name: 'claimant', type: 'address' },
          { name: 'description', type: 'string' },
          { name: 'metadataHash', type: 'bytes32' },
          { name: 'documentRef', type: 'string' },
          { name: 'submittedAt', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'reviewer', type: 'address' },
          { name: 'reviewedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getWarrantiesByOwner',
    stateMutability: 'view',
    inputs: [{ name: 'ownerAddr', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getUserRegistrations',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getPendingRegistrations',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getStats',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'warranties', type: 'uint256' },
      { name: 'registrations', type: 'uint256' },
      { name: 'approved', type: 'uint256' },
      { name: 'rejected', type: 'uint256' },
      { name: 'transfers', type: 'uint256' },
      { name: 'claims', type: 'uint256' },
      { name: 'approvedClaims', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'isAuthorizedIssuer',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },

  // ── Events ─────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'WarrantyRegistered',
    inputs: [
      { name: 'warrantyId', type: 'uint256', indexed: true },
      { name: 'productId', type: 'string', indexed: false },
      { name: 'registrant', type: 'address', indexed: true },
      { name: 'submittedAt', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WarrantyApproved',
    inputs: [
      { name: 'warrantyId', type: 'uint256', indexed: true },
      { name: 'issuer', type: 'address', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'issuedAt', type: 'uint256', indexed: false },
      { name: 'expiresAt', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WarrantyRejected',
    inputs: [
      { name: 'warrantyId', type: 'uint256', indexed: true },
      { name: 'reviewer', type: 'address', indexed: true },
      { name: 'reason', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WarrantyCreated',
    inputs: [
      { name: 'warrantyId', type: 'uint256', indexed: true },
      { name: 'productId', type: 'string', indexed: false },
      { name: 'issuer', type: 'address', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'issuedAt', type: 'uint256', indexed: false },
      { name: 'expiresAt', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WarrantyTransferred',
    inputs: [
      { name: 'warrantyId', type: 'uint256', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ClaimSubmitted',
    inputs: [
      { name: 'warrantyId', type: 'uint256', indexed: true },
      { name: 'claimId', type: 'uint256', indexed: true },
      { name: 'claimant', type: 'address', indexed: true },
      { name: 'metadataHash', type: 'bytes32', indexed: false },
      { name: 'documentRef', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ClaimReviewed',
    inputs: [
      { name: 'warrantyId', type: 'uint256', indexed: true },
      { name: 'claimId', type: 'uint256', indexed: true },
      { name: 'reviewer', type: 'address', indexed: true },
      { name: 'decision', type: 'uint8', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WarrantyCancelled',
    inputs: [
      { name: 'warrantyId', type: 'uint256', indexed: true },
      { name: 'cancelledBy', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'IssuerAdded',
    inputs: [
      { name: 'issuer', type: 'address', indexed: true },
      { name: 'addedBy', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'IssuerRemoved',
    inputs: [
      { name: 'issuer', type: 'address', indexed: true },
      { name: 'removedBy', type: 'address', indexed: true },
    ],
  },
] as const

// SPDX: WarrantyX — Contract ABI
// Auto-generated from: contract/out/WarrantyX.sol/WarrantyX.json
// Contract: 0x3EEd2A5a337A8c954276049d2FBD490655B55f31
// Network: Bohr Testnet (Chain 968)

export const warrantyXAbi = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addIssuer",
    "inputs": [{ "name": "issuer", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelWarranty",
    "inputs": [{ "name": "warrantyId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createWarranty",
    "inputs": [
      { "name": "productId", "type": "string", "internalType": "string" },
      { "name": "productName", "type": "string", "internalType": "string" },
      { "name": "productMetaHash", "type": "bytes32", "internalType": "bytes32" },
      { "name": "productMetaRef", "type": "string", "internalType": "string" },
      { "name": "initialOwner", "type": "address", "internalType": "address" },
      { "name": "durationSeconds", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "warrantyId", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getClaim",
    "inputs": [
      { "name": "warrantyId", "type": "uint256", "internalType": "uint256" },
      { "name": "claimIndex", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct WarrantyX.Claim",
        "components": [
          { "name": "claimId", "type": "uint256", "internalType": "uint256" },
          { "name": "claimant", "type": "address", "internalType": "address" },
          { "name": "description", "type": "string", "internalType": "string" },
          { "name": "metadataHash", "type": "bytes32", "internalType": "bytes32" },
          { "name": "documentRef", "type": "string", "internalType": "string" },
          { "name": "submittedAt", "type": "uint256", "internalType": "uint256" },
          { "name": "status", "type": "uint8", "internalType": "enum WarrantyX.ClaimStatus" },
          { "name": "reviewer", "type": "address", "internalType": "address" },
          { "name": "reviewedAt", "type": "uint256", "internalType": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getClaims",
    "inputs": [{ "name": "warrantyId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct WarrantyX.Claim[]",
        "components": [
          { "name": "claimId", "type": "uint256", "internalType": "uint256" },
          { "name": "claimant", "type": "address", "internalType": "address" },
          { "name": "description", "type": "string", "internalType": "string" },
          { "name": "metadataHash", "type": "bytes32", "internalType": "bytes32" },
          { "name": "documentRef", "type": "string", "internalType": "string" },
          { "name": "submittedAt", "type": "uint256", "internalType": "uint256" },
          { "name": "status", "type": "uint8", "internalType": "enum WarrantyX.ClaimStatus" },
          { "name": "reviewer", "type": "address", "internalType": "address" },
          { "name": "reviewedAt", "type": "uint256", "internalType": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getStats",
    "inputs": [],
    "outputs": [
      { "name": "warranties", "type": "uint256", "internalType": "uint256" },
      { "name": "transfers", "type": "uint256", "internalType": "uint256" },
      { "name": "claims", "type": "uint256", "internalType": "uint256" },
      { "name": "approvedClaims", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalWarranties",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTransferHistory",
    "inputs": [{ "name": "warrantyId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct WarrantyX.TransferRecord[]",
        "components": [
          { "name": "from", "type": "address", "internalType": "address" },
          { "name": "to", "type": "address", "internalType": "address" },
          { "name": "timestamp", "type": "uint256", "internalType": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWarranty",
    "inputs": [{ "name": "warrantyId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      {
        "name": "w",
        "type": "tuple",
        "internalType": "struct WarrantyX.Warranty",
        "components": [
          { "name": "warrantyId", "type": "uint256", "internalType": "uint256" },
          { "name": "productId", "type": "string", "internalType": "string" },
          { "name": "productName", "type": "string", "internalType": "string" },
          { "name": "productMetaHash", "type": "bytes32", "internalType": "bytes32" },
          { "name": "productMetaRef", "type": "string", "internalType": "string" },
          { "name": "issuer", "type": "address", "internalType": "address" },
          { "name": "owner", "type": "address", "internalType": "address" },
          { "name": "issuedAt", "type": "uint256", "internalType": "uint256" },
          { "name": "expiresAt", "type": "uint256", "internalType": "uint256" },
          { "name": "status", "type": "uint8", "internalType": "enum WarrantyX.WarrantyStatus" },
          { "name": "transferCount", "type": "uint256", "internalType": "uint256" },
          { "name": "claimCount", "type": "uint256", "internalType": "uint256" },
          { "name": "approvedClaimCount", "type": "uint256", "internalType": "uint256" },
          { "name": "rejectedClaimCount", "type": "uint256", "internalType": "uint256" },
          { "name": "lastClaimAt", "type": "uint256", "internalType": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWarrantiesByOwner",
    "inputs": [{ "name": "ownerAddr", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWarrantyOwner",
    "inputs": [{ "name": "warrantyId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isAuthorizedIssuer",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isWarrantyValid",
    "inputs": [{ "name": "warrantyId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "removeIssuer",
    "inputs": [{ "name": "issuer", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "reviewClaim",
    "inputs": [
      { "name": "warrantyId", "type": "uint256", "internalType": "uint256" },
      { "name": "approve", "type": "bool", "internalType": "bool" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "submitClaim",
    "inputs": [
      { "name": "warrantyId", "type": "uint256", "internalType": "uint256" },
      { "name": "description", "type": "string", "internalType": "string" },
      { "name": "metadataHash", "type": "bytes32", "internalType": "bytes32" },
      { "name": "documentRef", "type": "string", "internalType": "string" }
    ],
    "outputs": [{ "name": "claimId", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalApprovedClaims",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalClaims",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalTransfers",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalWarranties",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferWarranty",
    "inputs": [
      { "name": "warrantyId", "type": "uint256", "internalType": "uint256" },
      { "name": "newOwner", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ClaimReviewed",
    "inputs": [
      { "name": "warrantyId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "claimId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "reviewer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "decision", "type": "uint8", "indexed": false, "internalType": "enum WarrantyX.ClaimStatus" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ClaimSubmitted",
    "inputs": [
      { "name": "warrantyId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "claimId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "claimant", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "metadataHash", "type": "bytes32", "indexed": false, "internalType": "bytes32" },
      { "name": "documentRef", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "IssuerAdded",
    "inputs": [
      { "name": "issuer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "addedBy", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "IssuerRemoved",
    "inputs": [
      { "name": "issuer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "removedBy", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WarrantyCancelled",
    "inputs": [
      { "name": "warrantyId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "cancelledBy", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WarrantyCreated",
    "inputs": [
      { "name": "warrantyId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "productId", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "issuer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "owner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "issuedAt", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "expiresAt", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WarrantyTransferred",
    "inputs": [
      { "name": "warrantyId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "from", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "to", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const


// ─────────────────────────────────────────────────────────────────────────────
// useWarranty — all contract reads/writes for WarrantyX
// ─────────────────────────────────────────────────────────────────────────────
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { CONTRACT_ADDRESS } from '@/config/chains'
import { warrantyXAbi } from '@/contracts/WarrantyX.abi'
import type { Warranty, Claim, TransferRecord, PlatformStats } from '@/types/warranty'

// ── Read: single warranty ─────────────────────────────────────────────────────
export function useWarranty(warrantyId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'getWarranty',
    args: warrantyId !== undefined ? [warrantyId] : undefined,
    query: {
      enabled: warrantyId !== undefined,
      select: (data) => data as Warranty,
    },
  })
}

// ── Read: warranties by owner ─────────────────────────────────────────────────
export function useWarrantiesByOwner(ownerAddr: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'getWarrantiesByOwner',
    args: ownerAddr ? [ownerAddr] : undefined,
    query: {
      enabled: !!ownerAddr,
      select: (data) => (data as bigint[]) ?? [],
    },
  })
}

// ── Read: claims for a warranty ───────────────────────────────────────────────
export function useClaims(warrantyId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'getClaims',
    args: warrantyId !== undefined ? [warrantyId] : undefined,
    query: {
      enabled: warrantyId !== undefined,
      select: (data) => (data as Claim[]) ?? [],
    },
  })
}

// ── Read: transfer history ────────────────────────────────────────────────────
export function useTransferHistory(warrantyId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'getTransferHistory',
    args: warrantyId !== undefined ? [warrantyId] : undefined,
    query: {
      enabled: warrantyId !== undefined,
      select: (data) => (data as TransferRecord[]) ?? [],
    },
  })
}

// ── Read: platform stats ──────────────────────────────────────────────────────
export function usePlatformStats() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'getStats',
    query: {
      select: (data) => {
        const [warranties, transfers, claims, approvedClaims] = data as [bigint, bigint, bigint, bigint]
        return { warranties, transfers, claims, approvedClaims } as PlatformStats
      },
    },
  })
}

// ── Read: is authorized issuer ────────────────────────────────────────────────
export function useIsIssuer(addr: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'isAuthorizedIssuer',
    args: addr ? [addr] : undefined,
    query: {
      enabled: !!addr,
      select: (data) => Boolean(data),
    },
  })
}

// ── Read: is warranty valid ───────────────────────────────────────────────────
export function useIsWarrantyValid(warrantyId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'isWarrantyValid',
    args: warrantyId !== undefined ? [warrantyId] : undefined,
    query: {
      enabled: warrantyId !== undefined,
      select: (data) => Boolean(data),
    },
  })
}

// ── Read: total warranties ────────────────────────────────────────────────────
export function useTotalWarranties() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'getTotalWarranties',
    query: {
      select: (data) => data as bigint,
    },
  })
}

// ── Write: create warranty ────────────────────────────────────────────────────
export function useCreateWarranty() {
  const qc = useQueryClient()
  const { writeContractAsync, isPending, data: hash, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  async function createWarranty(args: {
    productId: string
    productName: string
    productMetaHash: `0x${string}`
    productMetaRef: string
    initialOwner: `0x${string}`
    durationSeconds: bigint
  }) {
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: warrantyXAbi,
      functionName: 'createWarranty',
      args: [
        args.productId,
        args.productName,
        args.productMetaHash,
        args.productMetaRef,
        args.initialOwner,
        args.durationSeconds,
      ],
    })
    return txHash
  }

  // Invalidate stats + owner list when tx confirmed
  if (receipt.data) {
    qc.invalidateQueries({ queryKey: ['getStats'] })
    qc.invalidateQueries({ queryKey: ['getTotalWarranties'] })
  }

  return { createWarranty, isPending, hash, receipt, error, reset }
}

// ── Write: transfer warranty ──────────────────────────────────────────────────
export function useTransferWarranty(warrantyId: bigint) {
  const qc = useQueryClient()
  const { writeContractAsync, isPending, data: hash, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  async function transferWarranty(newOwner: `0x${string}`) {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: warrantyXAbi,
      functionName: 'transferWarranty',
      args: [warrantyId, newOwner],
    })
  }

  if (receipt.data) {
    qc.invalidateQueries({ queryKey: ['getWarranty', warrantyId.toString()] })
    qc.invalidateQueries({ queryKey: ['getWarrantiesByOwner'] })
    qc.invalidateQueries({ queryKey: ['getTransferHistory', warrantyId.toString()] })
    qc.invalidateQueries({ queryKey: ['getStats'] })
  }

  return { transferWarranty, isPending, hash, receipt, error, reset }
}

// ── Write: submit claim ───────────────────────────────────────────────────────
export function useSubmitClaim(warrantyId: bigint) {
  const qc = useQueryClient()
  const { writeContractAsync, isPending, data: hash, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  async function submitClaim(args: {
    description: string
    metadataHash: `0x${string}`
    documentRef: string
  }) {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: warrantyXAbi,
      functionName: 'submitClaim',
      args: [warrantyId, args.description, args.metadataHash, args.documentRef],
    })
  }

  if (receipt.data) {
    qc.invalidateQueries({ queryKey: ['getWarranty', warrantyId.toString()] })
    qc.invalidateQueries({ queryKey: ['getClaims', warrantyId.toString()] })
    qc.invalidateQueries({ queryKey: ['getStats'] })
  }

  return { submitClaim, isPending, hash, receipt, error, reset }
}

// ── Write: review claim ───────────────────────────────────────────────────────
export function useReviewClaim(warrantyId: bigint) {
  const qc = useQueryClient()
  const { writeContractAsync, isPending, data: hash, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  async function reviewClaim(approve: boolean) {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: warrantyXAbi,
      functionName: 'reviewClaim',
      args: [warrantyId, approve],
    })
  }

  if (receipt.data) {
    qc.invalidateQueries({ queryKey: ['getWarranty', warrantyId.toString()] })
    qc.invalidateQueries({ queryKey: ['getClaims', warrantyId.toString()] })
    qc.invalidateQueries({ queryKey: ['getStats'] })
  }

  return { reviewClaim, isPending, hash, receipt, error, reset }
}

// ── Write: cancel warranty ────────────────────────────────────────────────────
export function useCancelWarranty(warrantyId: bigint) {
  const qc = useQueryClient()
  const { writeContractAsync, isPending, data: hash, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  async function cancelWarranty() {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: warrantyXAbi,
      functionName: 'cancelWarranty',
      args: [warrantyId],
    })
  }

  if (receipt.data) {
    qc.invalidateQueries({ queryKey: ['getWarranty', warrantyId.toString()] })
  }

  return { cancelWarranty, isPending, hash, receipt, error, reset }
}

// ── Write: add issuer (admin) ─────────────────────────────────────────────────
export function useAddIssuer() {
  const { writeContractAsync, isPending, data: hash, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  async function addIssuer(issuerAddr: `0x${string}`) {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: warrantyXAbi,
      functionName: 'addIssuer',
      args: [issuerAddr],
    })
  }

  return { addIssuer, isPending, hash, receipt, error, reset }
}


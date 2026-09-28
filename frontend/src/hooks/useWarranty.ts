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

// ── Read: warranties by owner (active/approved) ───────────────────────────────
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

// ── Read: all user registrations (Pending, Active, Rejected) ──────────────────
export function useUserRegistrations(userAddr: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'getUserRegistrations',
    args: userAddr ? [userAddr] : undefined,
    query: {
      enabled: !!userAddr,
      select: (data) => (data as bigint[]) ?? [],
    },
  })
}

// ── Read: pending registrations (for issuers/admins) ─────────────────────────
export function usePendingRegistrations() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: warrantyXAbi,
    functionName: 'getPendingRegistrations',
    query: {
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
        const [warranties, registrations, approved, rejected, transfers, claims, approvedClaims] = data as [bigint, bigint, bigint, bigint, bigint, bigint, bigint]
        return { warranties, registrations, approved, rejected, transfers, claims, approvedClaims } as PlatformStats
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

// ── Write: user register warranty (Pending) ───────────────────────────────────
export function useRegisterWarranty() {
  const qc = useQueryClient()
  const { writeContractAsync, isPending, data: hash, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  async function registerWarranty(args: {
    productId: string
    productName: string
    productMetaHash: `0x${string}`
    productMetaRef: string
    proofRef: string
    durationSeconds: bigint
  }) {
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: warrantyXAbi,
      functionName: 'registerWarranty',
      args: [
        args.productId,
        args.productName,
        args.productMetaHash,
        args.productMetaRef,
        args.proofRef,
        args.durationSeconds,
      ],
    })
    return txHash
  }

  if (receipt.data) {
    qc.invalidateQueries({ queryKey: ['getStats'] })
    qc.invalidateQueries({ queryKey: ['getUserRegistrations'] })
    qc.invalidateQueries({ queryKey: ['getPendingRegistrations'] })
    qc.invalidateQueries({ queryKey: ['getTotalWarranties'] })
  }

  return { registerWarranty, isPending, hash, receipt, error, reset }
}

// ── Write: issuer approve warranty (Pending -> Active) ───────────────────────
export function useApproveWarranty() {
  const qc = useQueryClient()
  const { writeContractAsync, isPending, data: hash, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  async function approveWarranty(warrantyId: bigint) {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: warrantyXAbi,
      functionName: 'approveWarranty',
      args: [warrantyId],
    })
  }

  if (receipt.data) {
    qc.invalidateQueries({ queryKey: ['getStats'] })
    qc.invalidateQueries({ queryKey: ['getPendingRegistrations'] })
    qc.invalidateQueries({ queryKey: ['getWarrantiesByOwner'] })
    qc.invalidateQueries({ queryKey: ['getUserRegistrations'] })
  }

  return { approveWarranty, isPending, hash, receipt, error, reset }
}

// ── Write: issuer reject warranty (Pending -> Rejected) ─────────────────────
export function useRejectWarranty() {
  const qc = useQueryClient()
  const { writeContractAsync, isPending, data: hash, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  async function rejectWarranty(warrantyId: bigint, reason: string) {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: warrantyXAbi,
      functionName: 'rejectWarranty',
      args: [warrantyId, reason],
    })
  }

  if (receipt.data) {
    qc.invalidateQueries({ queryKey: ['getStats'] })
    qc.invalidateQueries({ queryKey: ['getPendingRegistrations'] })
    qc.invalidateQueries({ queryKey: ['getUserRegistrations'] })
  }

  return { rejectWarranty, isPending, hash, receipt, error, reset }
}

// ── Write: direct issuer create warranty (Active) ────────────────────────────
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

  if (receipt.data) {
    qc.invalidateQueries({ queryKey: ['getStats'] })
    qc.invalidateQueries({ queryKey: ['getWarrantiesByOwner'] })
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

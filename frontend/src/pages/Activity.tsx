import { useTotalWarranties, usePlatformStats } from '@/hooks/useWarranty'
import { usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { CONTRACT_ADDRESS, explorerTx, explorerAddr } from '@/config/chains'
import { warrantyXAbi } from '@/contracts/WarrantyX.abi'
import { shortAddr, formatDateTime } from '@/utils/format'
import styles from './Activity.module.css'

export default function Activity() {
  const { data: stats } = usePlatformStats()
  const client = usePublicClient()

  const { data: events, isLoading } = useQuery({
    queryKey: ['activity-events'],
    queryFn: async () => {
      if (!client) return []
      try {
        // Fetch last 5000 blocks of events
        const latest = await client.getBlockNumber()
        const fromBlock = latest > 5000n ? latest - 5000n : 0n

        const [created, transferred, claimed, reviewed] = await Promise.all([
          client.getLogs({ address: CONTRACT_ADDRESS, event: warrantyXAbi.find(e => e.type === 'event' && e.name === 'WarrantyCreated') as any, fromBlock }),
          client.getLogs({ address: CONTRACT_ADDRESS, event: warrantyXAbi.find(e => e.type === 'event' && e.name === 'WarrantyTransferred') as any, fromBlock }),
          client.getLogs({ address: CONTRACT_ADDRESS, event: warrantyXAbi.find(e => e.type === 'event' && e.name === 'ClaimSubmitted') as any, fromBlock }),
          client.getLogs({ address: CONTRACT_ADDRESS, event: warrantyXAbi.find(e => e.type === 'event' && e.name === 'ClaimReviewed') as any, fromBlock }),
        ])

        type RawEvent = { type: string; blockNumber: bigint; transactionHash: `0x${string}`; args: Record<string, unknown> }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toEvt = (type: string, logs: any[]): RawEvent[] =>
          logs.map((e: any) => ({
            type,
            blockNumber: e.blockNumber ?? 0n,
            transactionHash: (e.transactionHash ?? '0x') as `0x${string}`,
            args: (e.args ?? {}) as Record<string, unknown>,
          }))

        const allEvents: RawEvent[] = [
          ...toEvt('WarrantyCreated', created),
          ...toEvt('WarrantyTransferred', transferred),
          ...toEvt('ClaimSubmitted', claimed),
          ...toEvt('ClaimReviewed', reviewed),
        ]

        return allEvents.sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : -1)).slice(0, 50)
      } catch { return [] }
    },
    enabled: !!client,
    staleTime: 30_000,
  })

  function eventIcon(type: string) {
    switch (type) {
      case 'WarrantyCreated':    return '📜'
      case 'WarrantyTransferred': return '⟳'
      case 'ClaimSubmitted':     return '📋'
      case 'ClaimReviewed':      return '🔍'
      default:                   return '⚡'
    }
  }

  function eventLabel(type: string, args: Record<string, unknown>) {
    switch (type) {
      case 'WarrantyCreated':    return `Warranty #${String(args.warrantyId ?? '')} created`
      case 'WarrantyTransferred': return `Warranty #${String(args.warrantyId ?? '')} transferred to ${shortAddr(String(args.to ?? ''), 6)}`
      case 'ClaimSubmitted':     return `Claim submitted on Warranty #${String(args.warrantyId ?? '')}`
      case 'ClaimReviewed':      return `Claim on Warranty #${String(args.warrantyId ?? '')} ${(args.decision as number) === 1 ? 'approved' : 'rejected'}`
      default: return type
    }
  }

  return (
    <div className={styles.root}>
      <h1 className="section-title">📡 Activity</h1>
      <p className="section-sub">Recent on-chain activity from the WarrantyX contract on Bohr Testnet.</p>

      <div className={styles.statsRow}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statNum}>{stats?.warranties?.toString() ?? '—'}</div>
          <div className={styles.statLabel}>Warranties</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statNum}>{stats?.transfers?.toString() ?? '—'}</div>
          <div className={styles.statLabel}>Transfers</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statNum}>{stats?.claims?.toString() ?? '—'}</div>
          <div className={styles.statLabel}>Claims</div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statNum}>{stats?.approvedClaims?.toString() ?? '—'}</div>
          <div className={styles.statLabel}>Approved</div>
        </div>
      </div>

      <div className={`card ${styles.feed}`}>
        <h3 className={styles.feedTitle}>Recent Events <span className={styles.feedSub}>(last 5000 blocks)</span></h3>
        {isLoading && <div className={styles.loading}><span className="spinner" /> Loading events…</div>}
        {!isLoading && (!events || events.length === 0) && (
          <div className="empty-state">
            <div className="empty-state__icon">📭</div>
            <div className="empty-state__title">No recent events found</div>
            <p className="text-muted">Events will appear here as activity occurs on the contract.</p>
          </div>
        )}
        {events?.map((ev, i) => (
          <div key={i} className={styles.eventRow}>
            <span className={styles.eventIcon}>{eventIcon(ev.type)}</span>
            <div className={styles.eventBody}>
              <div className={styles.eventLabel}>{eventLabel(ev.type, ev.args)}</div>
              <div className={styles.eventMeta}>
                Block #{ev.blockNumber.toString()}
                {' · '}
                <a href={explorerTx(ev.transactionHash)} target="_blank" rel="noopener noreferrer">View tx ↗</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

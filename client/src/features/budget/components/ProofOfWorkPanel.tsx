import { useState } from 'react'
import { Button } from '../../../shared/components/Button.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { ProofOfWork } from '../budgetTypes.ts'

type ProofOfWorkPanelProps = {
  proofs: ProofOfWork[]
  isApproving: boolean
  onApprove: (month: string) => void
}

export function ProofOfWorkPanel({ proofs, isApproving, onApprove }: ProofOfWorkPanelProps) {
  const { t, formatMonth, formatPersonDays } = useTranslation()
  // Approval is final, so it takes a second click to confirm.
  const [confirmingMonth, setConfirmingMonth] = useState<string | null>(null)

  function approve(month: string) {
    setConfirmingMonth(null)
    onApprove(month)
  }

  return (
    <Panel title={t('budget.proofPanelTitle')}>
      <p className="mb-4 text-sm text-muted">{t('budget.proofHint')}</p>
      {proofs.length === 0 && <p className="text-sm text-muted">{t('budget.noBookings')}</p>}
      <ul className="grid gap-4">
        {proofs.map((proof) => (
          <li key={proof.month} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{formatMonth(proof.month)}</h3>
              {proof.status === 'approved' ? (
                <StatusChip tone="success">{t('budget.proofApproved')}</StatusChip>
              ) : (
                <StatusChip tone="neutral">{t('budget.proofOpen')}</StatusChip>
              )}
            </div>
            <p className="mt-1 text-sm tabular-nums">
              {formatPersonDays(proof.personDays)} ·{' '}
              {t('budget.proofTotals', { consultants: proof.consultantCount, bookings: proof.bookingCount })}
            </p>
            {proof.status === 'approved' && (
              <p className="mt-1 text-sm text-muted">{t('budget.proofApprovedBy', { name: proof.approvedByName ?? '' })}</p>
            )}
            {proof.status === 'open' && confirmingMonth !== proof.month && (
              <Button variant="signal" className="mt-3" disabled={isApproving} onClick={() => setConfirmingMonth(proof.month)}>
                {t('budget.proofApprove')}
              </Button>
            )}
            {proof.status === 'open' && confirmingMonth === proof.month && (
              <div className="mt-3 border border-ink bg-paper p-3">
                <p className="text-sm font-semibold">{t('budget.proofConfirmQuestion')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="signal" disabled={isApproving} onClick={() => approve(proof.month)}>
                    {t('budget.proofConfirm')}
                  </Button>
                  <Button variant="ghost" disabled={isApproving} onClick={() => setConfirmingMonth(null)}>
                    {t('budget.proofCancel')}
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

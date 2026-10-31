import { Button } from '../../../shared/components/Button.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { BookingProposal } from '../bookingTypes.ts'

type BookingProposalCardProps = {
  proposal: BookingProposal
  orderId: string
  isConfirming: boolean
  onConfirm: () => void
  onDiscard: () => void
}

export function BookingProposalCard({ proposal, orderId, isConfirming, onConfirm, onDiscard }: BookingProposalCardProps) {
  const { t, formatDate, formatHours } = useTranslation()

  return (
    <section aria-label={t('bookings.proposalLabel')} className="mt-4 border border-ink bg-paper p-4">
      <h3 className="text-xs font-semibold tracking-widest text-muted uppercase">{t('bookings.proposalHeading')}</h3>
      <p className="mt-2 text-sm">
        {formatDate(proposal.date)} · {proposal.startTime}–{proposal.endTime} · <b>{formatHours(proposal.hours)}</b> · {t('bookings.proposalOrder', { orderId })}
      </p>
      <p className="mt-1 text-sm text-muted">{proposal.description}</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <Button variant="signal" disabled={isConfirming} onClick={onConfirm}>
          {isConfirming ? t('bookings.confirming') : t('bookings.confirm')}
        </Button>
        <Button variant="ghost" disabled={isConfirming} onClick={onDiscard}>
          {t('bookings.discard')}
        </Button>
      </div>
    </section>
  )
}

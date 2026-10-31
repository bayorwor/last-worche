import { Button } from '../../../shared/components/Button.tsx'
import { DEMO_ORDER_ID } from '../../../shared/config/demoContext.ts'
import { formatDate, formatHours } from '../../../shared/utils/formatters.ts'
import type { BookingProposal } from '../bookingTypes.ts'

type BookingProposalCardProps = {
  proposal: BookingProposal
  isConfirming: boolean
  onConfirm: () => void
  onDiscard: () => void
}

export function BookingProposalCard({ proposal, isConfirming, onConfirm, onDiscard }: BookingProposalCardProps) {
  return (
    <section aria-label="Buchungsvorschlag" className="mt-4 border border-ink bg-paper p-4">
      <h3 className="text-xs font-semibold tracking-widest text-muted uppercase">Erkannt — bitte bestätigen</h3>
      <p className="mt-2 text-sm">
        {formatDate(proposal.date)} · <b>{formatHours(proposal.hours)}</b> · Auftrag {DEMO_ORDER_ID}
      </p>
      <p className="mt-1 text-sm text-muted">{proposal.description}</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <Button variant="signal" disabled={isConfirming} onClick={onConfirm}>
          {isConfirming ? 'Wird gespeichert …' : 'Buchung bestätigen'}
        </Button>
        <Button variant="ghost" disabled={isConfirming} onClick={onDiscard}>
          Verwerfen
        </Button>
      </div>
    </section>
  )
}

// The proposal from the sentence, which the person can correct, or an empty booking entered by hand.
import { Button } from '../../../shared/components/Button.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { breakMinutesOf, workedHours } from '../bookingTimes.ts'
import type { BookingProposal } from '../bookingTypes.ts'

type BookingProposalFormProps = {
  proposal: BookingProposal
  orderId: string
  isConfirming: boolean
  canConfirm: boolean
  onEdit: (changes: Partial<BookingProposal>) => void
  onConfirm: () => void
  onDiscard: () => void
  children: React.ReactNode
}

const INPUT_CLASSES = 'mt-1 min-h-11 w-full min-w-0 border border-ink bg-panel px-2.5 py-2 text-base'
const LABEL_CLASSES = 'block text-xs font-semibold'

export function BookingProposalForm({ proposal, orderId, isConfirming, canConfirm, onEdit, onConfirm, onDiscard, children }: BookingProposalFormProps) {
  const { t, formatHours } = useTranslation()
  const breakMinutes = breakMinutesOf(proposal)

  function setTimes(startTime: string, endTime: string, nextBreakMinutes = breakMinutes) {
    onEdit({ startTime, endTime, hours: workedHours(startTime, endTime, nextBreakMinutes) })
  }

  return (
    <section aria-label={t('bookings.proposalLabel')} className="mt-4 border border-ink bg-paper p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-widest text-muted uppercase">{t('bookings.proposalHeading')}</h3>
        <p className="text-sm">
          <b>{formatHours(proposal.hours)}</b> · {t('bookings.proposalOrder', { orderId })}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="booking-date" className={LABEL_CLASSES}>{t('bookings.fieldDate')}</label>
          <input id="booking-date" type="date" value={proposal.date} onChange={(event) => onEdit({ date: event.target.value })} className={INPUT_CLASSES} />
        </div>
        <div>
          <label htmlFor="booking-start" className={LABEL_CLASSES}>{t('bookings.fieldStart')}</label>
          <input id="booking-start" type="time" value={proposal.startTime} onChange={(event) => setTimes(event.target.value, proposal.endTime)} className={INPUT_CLASSES} />
        </div>
        <div>
          <label htmlFor="booking-end" className={LABEL_CLASSES}>{t('bookings.fieldEnd')}</label>
          <input id="booking-end" type="time" value={proposal.endTime} onChange={(event) => setTimes(proposal.startTime, event.target.value)} className={INPUT_CLASSES} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="booking-break" className={LABEL_CLASSES}>{t('bookings.fieldBreak')}</label>
          <input
            id="booking-break"
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            value={breakMinutes}
            onChange={(event) => setTimes(proposal.startTime, proposal.endTime, Math.max(Number(event.target.value), 0))}
            className={INPUT_CLASSES}
          />
        </div>
      </div>
      <label htmlFor="booking-description" className={`mt-3 ${LABEL_CLASSES}`}>{t('bookings.fieldDescription')}</label>
      <input
        id="booking-description"
        type="text"
        value={proposal.description}
        placeholder={t('bookings.fieldDescriptionHint')}
        onChange={(event) => onEdit({ description: event.target.value })}
        className={`${INPUT_CLASSES} placeholder:text-muted`}
      />
      {children}
      <div className="mt-3 flex flex-wrap gap-2.5">
        <Button variant="signal" disabled={isConfirming || !canConfirm} onClick={onConfirm}>
          {isConfirming ? t('bookings.confirming') : t('bookings.confirm')}
        </Button>
        <Button variant="ghost" disabled={isConfirming} onClick={onDiscard}>
          {t('bookings.discard')}
        </Button>
      </div>
    </section>
  )
}

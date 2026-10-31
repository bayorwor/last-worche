import { Panel } from '../../../shared/components/Panel.tsx'
import { ProgressBar } from '../../../shared/components/ProgressBar.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { todayIsoDate } from '../../../shared/utils/todayIsoDate.ts'
import type { Booking } from '../bookingTypes.ts'

const MAX_HOURS_PER_DAY = 10 // only for this display: the server enforces the rule (ArbZG §3)

// Today's total across all of this consultant's orders.
export function TodayHoursPanel({ bookings }: { bookings: Booking[] }) {
  const { t, formatHours } = useTranslation()
  const today = todayIsoDate()
  const hoursToday = bookings
    .filter((booking) => booking.date === today)
    .reduce((total, booking) => total + booking.hours, 0)

  return (
    <Panel title={t('bookings.todayPanelTitle')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p>
          <b className="text-3xl font-extrabold tabular-nums">{formatHours(hoursToday)}</b>{' '}
          <span className="text-sm text-muted">{t('bookings.todayLimit', { maxHours: MAX_HOURS_PER_DAY })}</span>
        </p>
        {hoursToday >= MAX_HOURS_PER_DAY ? (
          <StatusChip tone="signal">{t('bookings.todayLimitReached')}</StatusChip>
        ) : (
          <StatusChip tone="success">{t('bookings.todayOnTrack')}</StatusChip>
        )}
      </div>
      <ProgressBar label={t('bookings.todayProgressLabel')} percent={(hoursToday / MAX_HOURS_PER_DAY) * 100} className="mt-3" />
      <p className="mt-2 text-xs text-muted">{t('bookings.todayRestNote')}</p>
    </Panel>
  )
}

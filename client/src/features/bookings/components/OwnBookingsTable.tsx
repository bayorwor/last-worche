import { DataTable } from '../../../shared/components/DataTable.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { Booking } from '../bookingTypes.ts'

export function ConfirmedBookingsTable({ bookings }: { bookings: Booking[] }) {
  const { t, formatDate, formatHours } = useTranslation()

  if (bookings.length === 0) {
    return <p className="text-sm text-muted">{t('bookings.noneYet')}</p>
  }

  return (
    <DataTable headers={[t('bookings.columnDate'), t('bookings.columnDuration'), t('bookings.columnActivity'), t('bookings.columnOrder')]}>
      {bookings.map((booking) => (
        <tr key={booking.id}>
          <td className="whitespace-nowrap">
            {formatDate(booking.date)}
            <span className="block text-muted">
              {booking.startTime}–{booking.endTime}
            </span>
          </td>
          <td className="font-bold">{formatHours(booking.hours)}</td>
          <td>{booking.description}</td>
          <td className="text-muted">{booking.orderId}</td>
        </tr>
      ))}
    </DataTable>
  )
}

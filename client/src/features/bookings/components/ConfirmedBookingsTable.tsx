import { DataTable } from '../../../shared/components/DataTable.tsx'
import { formatDate, formatHours } from '../../../shared/utils/formatters.ts'
import type { Booking } from '../bookingTypes.ts'

export function ConfirmedBookingsTable({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted">Noch keine Buchungen in dieser Sitzung.</p>
  }

  return (
    <DataTable headers={['Datum', 'Dauer', 'Tätigkeit', 'Auftrag']}>
      {bookings.map((booking) => (
        <tr key={booking.id}>
          <td className="whitespace-nowrap">{formatDate(booking.date)}</td>
          <td className="font-bold">{formatHours(booking.hours)}</td>
          <td>{booking.description}</td>
          <td className="text-muted">{booking.orderId}</td>
        </tr>
      ))}
    </DataTable>
  )
}

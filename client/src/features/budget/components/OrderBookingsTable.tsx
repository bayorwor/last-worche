import { DataTable } from '../../../shared/components/DataTable.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { OrderBooking } from '../budgetTypes.ts'

type OrderBookingsTableProps = {
  orderId: string
  bookings: OrderBooking[]
}

export function OrderBookingsTable({ orderId, bookings }: OrderBookingsTableProps) {
  const { t, formatDate, formatHours } = useTranslation()

  return (
    <Panel title={t('budget.bookingsPanelTitle', { orderId })}>
      {bookings.length === 0 ? (
        <p className="text-sm text-muted">{t('budget.noBookings')}</p>
      ) : (
        <DataTable
          headers={[
            t('budget.columnDate'),
            t('budget.columnConsultant'),
            t('budget.columnActivity'),
            t('budget.columnDuration'),
          ]}
        >
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td className="whitespace-nowrap">
                {formatDate(booking.date)}
                <span className="block text-muted">
                  {booking.startTime}–{booking.endTime}
                </span>
              </td>
              <td className="whitespace-nowrap">{booking.consultantName}</td>
              <td>{booking.description}</td>
              <td className="font-bold whitespace-nowrap">{formatHours(booking.hours)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </Panel>
  )
}

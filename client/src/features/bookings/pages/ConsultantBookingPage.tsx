import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { OrderSelect } from '../../../shared/components/OrderSelect.tsx'
import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import {
  confirmBookingProposal,
  fetchAssignedOrders,
  fetchBookingProposal,
  fetchOwnBookings,
  proposalDiscarded,
} from '../bookingsSlice.ts'
import { BookingProposalCard } from '../components/BookingProposalCard.tsx'
import { BookingSentenceForm } from '../components/BookingSentenceForm.tsx'
import { OwnBookingsTable } from '../components/OwnBookingsTable.tsx'

export default function ConsultantBookingPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { assignedOrders, assignedOrdersStatus, proposal, ownBookings, proposalStatus, confirmationStatus, error } =
    useAppSelector((state) => state.bookings)
  const consultantId = useAppSelector((state) => state.auth.user?.consultantId)
  const [chosenOrderId, setChosenOrderId] = useState<string | null>(null)
  const selectedOrderId = chosenOrderId ?? assignedOrders[0]?.id

  useEffect(() => {
    dispatch(fetchAssignedOrders())
  }, [dispatch])

  useEffect(() => {
    if (consultantId) {
      dispatch(fetchOwnBookings(consultantId))
    }
  }, [dispatch, consultantId])

  return (
    <>
      <PageTitle>{t('bookings.pageTitle')}</PageTitle>
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Panel title={t('bookings.formPanelTitle')}>
          {selectedOrderId && (
            <OrderSelect
              id="booking-order"
              className="mb-4"
              orders={assignedOrders}
              selectedOrderId={selectedOrderId}
              onChange={setChosenOrderId}
            />
          )}
          {assignedOrdersStatus === 'succeeded' && assignedOrders.length === 0 && (
            <p className="mb-4 text-sm text-muted">{t('orders.noneAssigned')}</p>
          )}
          <BookingSentenceForm
            isSubmitting={proposalStatus === 'loading'}
            onSubmit={(sentence) => dispatch(fetchBookingProposal(sentence))}
          />
          {proposal && selectedOrderId && (
            <BookingProposalCard
              proposal={proposal}
              orderId={selectedOrderId}
              isConfirming={confirmationStatus === 'loading'}
              onConfirm={() => dispatch(confirmBookingProposal({ proposal, orderId: selectedOrderId }))}
              onDiscard={() => dispatch(proposalDiscarded())}
            />
          )}
          {error && (
            <StatusMessage tone="error" className="mt-4">
              {t(error.key, error.values)}
            </StatusMessage>
          )}
          {confirmationStatus === 'succeeded' && (
            <StatusMessage tone="success" className="mt-4">
              {t('bookings.saved')}
            </StatusMessage>
          )}
        </Panel>
        <Panel
          title={t('bookings.ownPanelTitle')}
          aside={<StatusChip tone="neutral">{t('bookings.ownBookingsOnly')}</StatusChip>}
        >
          <OwnBookingsTable bookings={ownBookings} />
        </Panel>
      </div>
    </>
  )
}

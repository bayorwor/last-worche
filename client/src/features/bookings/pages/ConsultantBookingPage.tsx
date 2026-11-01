import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { OrderSelect } from '../../../shared/components/OrderSelect.tsx'
import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { todayIsoDate } from '../../../shared/utils/todayIsoDate.ts'
import {
  confirmBookingProposal,
  fetchAssignedOrders,
  fetchBookingCheck,
  fetchBookingProposal,
  fetchOwnBookings,
  manualBookingStarted,
  proposalDiscarded,
  proposalEdited,
} from '../bookingsSlice.ts'
import { BookingProposalForm } from '../components/BookingProposalForm.tsx'
import { BookingRuleChecklist } from '../components/BookingRuleChecklist.tsx'
import { BookingSentenceForm } from '../components/BookingSentenceForm.tsx'
import { TodayHoursPanel } from '../components/TodayHoursPanel.tsx'

export default function ConsultantBookingPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { assignedOrders, assignedOrdersStatus, proposal, ownBookings, proposalStatus, confirmationStatus, error, checkResult, checkError } =
    useAppSelector((state) => state.bookings)
  const consultantId = useAppSelector((state) => state.auth.user?.consultantId)
  const [chosenOrderId, setChosenOrderId] = useState<string | null>(null)
  const selectedOrderId = chosenOrderId ?? proposal?.suggestedOrderId ?? assignedOrders[0]?.id
  const hasDescription = Boolean(proposal?.description.trim())
  const allRulesPass = checkResult !== null && checkResult.checks.every((check) => check.passed)

  useEffect(() => {
    dispatch(fetchAssignedOrders())
  }, [dispatch])

  useEffect(() => {
    if (consultantId) {
      dispatch(fetchOwnBookings(consultantId))
    }
  }, [dispatch, consultantId])

  // Asks the server shortly after the last change, so typing does not send a request per key press.
  useEffect(() => {
    if (!proposal || !selectedOrderId || !hasDescription) {
      return undefined
    }
    const timer = setTimeout(() => dispatch(fetchBookingCheck({ proposal, orderId: selectedOrderId })), 250)
    return () => clearTimeout(timer)
  }, [dispatch, proposal, selectedOrderId, hasDescription])

  return (
    <>
      <PageTitle>{t('bookings.pageTitle')}</PageTitle>
      <div className="grid gap-6">
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
            onEnterByHand={() => dispatch(manualBookingStarted(todayIsoDate()))}
          />
          {proposal && selectedOrderId && (
            <BookingProposalForm
              proposal={proposal}
              orderId={selectedOrderId}
              isConfirming={confirmationStatus === 'loading'}
              canConfirm={hasDescription && allRulesPass}
              onEdit={(changes) => dispatch(proposalEdited(changes))}
              onConfirm={() => dispatch(confirmBookingProposal({ proposal, orderId: selectedOrderId }))}
              onDiscard={() => dispatch(proposalDiscarded())}
            >
              {!hasDescription && <p className="mt-3 text-sm text-muted">{t('bookings.descriptionNeeded')}</p>}
              {hasDescription && checkError && (
                <StatusMessage tone="error" className="mt-3">
                  {t(checkError.key, checkError.values)}
                </StatusMessage>
              )}
              {hasDescription && !checkError && checkResult && (
                <BookingRuleChecklist result={checkResult} onUseSlot={(slot) => dispatch(proposalEdited(slot))} />
              )}
            </BookingProposalForm>
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
        <TodayHoursPanel bookings={ownBookings} />
      </div>
    </>
  )
}

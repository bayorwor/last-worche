import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { confirmBookingProposal, fetchBookingProposal, proposalDiscarded } from '../bookingsSlice.ts'
import { BookingProposalCard } from '../components/BookingProposalCard.tsx'
import { BookingSentenceForm } from '../components/BookingSentenceForm.tsx'
import { ConfirmedBookingsTable } from '../components/ConfirmedBookingsTable.tsx'

export default function ConsultantBookingPage() {
  const dispatch = useAppDispatch()
  const { proposal, confirmedBookings, proposalStatus, confirmationStatus, errorMessage } = useAppSelector(
    (state) => state.bookings,
  )

  return (
    <>
      <PageTitle>Berater — Zeit buchen</PageTitle>
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Panel title="Buchung erfassen — ein Satz genügt">
          <BookingSentenceForm
            isSubmitting={proposalStatus === 'loading'}
            onSubmit={(sentence) => dispatch(fetchBookingProposal(sentence))}
          />
          {proposal && (
            <BookingProposalCard
              proposal={proposal}
              isConfirming={confirmationStatus === 'loading'}
              onConfirm={() => dispatch(confirmBookingProposal(proposal))}
              onDiscard={() => dispatch(proposalDiscarded())}
            />
          )}
          {errorMessage && (
            <StatusMessage tone="error" className="mt-4">
              {errorMessage}
            </StatusMessage>
          )}
          {confirmationStatus === 'succeeded' && (
            <StatusMessage tone="success" className="mt-4">
              Buchung gespeichert — die Projektleitung sieht die Auswirkung auf das Budget sofort.
            </StatusMessage>
          )}
        </Panel>
        <Panel title="In dieser Sitzung gebucht" aside={<StatusChip tone="neutral">Nur eigene Buchungen</StatusChip>}>
          <ConfirmedBookingsTable bookings={confirmedBookings} />
        </Panel>
      </div>
    </>
  )
}

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { InfoNote } from '../../../shared/components/InfoNote.tsx'
import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { fetchOwnBookings } from '../bookingsSlice.ts'
import { OwnBookingsTable } from '../components/OwnBookingsTable.tsx'

export default function OwnBookingsPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { ownBookings, error } = useAppSelector((state) => state.bookings)
  const consultantId = useAppSelector((state) => state.auth.user?.consultantId)

  useEffect(() => {
    if (consultantId) {
      dispatch(fetchOwnBookings(consultantId))
    }
  }, [dispatch, consultantId])

  return (
    <>
      <PageTitle>{t('bookings.ownPageTitle')}</PageTitle>
      <Panel title={t('bookings.ownPanelTitle')} aside={<StatusChip tone="neutral">{t('bookings.ownBookingsOnly')}</StatusChip>}>
        {/* Only with an empty list: otherwise this error is a rejected booking, shown on the booking tab. */}
        {error && ownBookings.length === 0 ? (
          <StatusMessage tone="error">{t(error.key, error.values)}</StatusMessage>
        ) : (
          <OwnBookingsTable bookings={ownBookings} />
        )}
        <InfoNote>{t('bookings.rulesNote')}</InfoNote>
      </Panel>
    </>
  )
}

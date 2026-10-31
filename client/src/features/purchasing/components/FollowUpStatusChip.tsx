import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'

export function FollowUpStatusChip({ needsFollowUpOrder }: { needsFollowUpOrder: boolean }) {
  const { t } = useTranslation()

  return needsFollowUpOrder ? (
    <StatusChip tone="signal">{t('purchasing.followUpNeeded')}</StatusChip>
  ) : (
    <StatusChip tone="success">{t('purchasing.onTrack')}</StatusChip>
  )
}

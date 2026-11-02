// The radar of one order: unusual booking patterns, each with the consultant, the days and why it was flagged.
import { DataTable } from '../../../shared/components/DataTable.tsx'
import { InfoNote } from '../../../shared/components/InfoNote.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { OrderRadar, RadarFlag } from '../budgetTypes.ts'
import { RADAR_KIND_KEYS } from '../radarFlagKeys.ts'

type RadarFlagTableProps = {
  orderId: string
  radar: OrderRadar
}

export function RadarFlagTable({ orderId, radar }: RadarFlagTableProps) {
  const { t, formatDate, formatHours } = useTranslation()

  function describe({ kind, details }: RadarFlag) {
    switch (kind) {
      case 'frequent-long-days':
        return t('radar.detailLongDays', { count: details.count ?? 0 })
      case 'weekend-work':
        return t('radar.detailWeekend')
      case 'pace-jump':
        return t('radar.detailPaceJump', { recent: formatHours(details.recentHours ?? 0), usual: formatHours(details.usualWeeklyHours ?? 0) })
      case 'just-under-limit':
        return t('radar.detailJustUnder', { hours: formatHours(details.hours ?? 0), free: formatHours(details.freeHoursBefore ?? 0) })
    }
  }

  // One date per line, so a date never breaks in the middle on a phone. A pace jump covers a week, so it shows as a range.
  function daysOf({ kind, days }: RadarFlag) {
    return days.map((day, index) => (
      <span key={day} className="block whitespace-nowrap">
        {formatDate(day)}
        {kind === 'pace-jump' && index === 0 ? ' –' : ''}
      </span>
    ))
  }

  return (
    <Panel
      title={t('radar.panelTitle', { orderId })}
      aside={<StatusChip tone="neutral">{t('radar.evaluatedOn', { date: formatDate(radar.evaluatedOn) })}</StatusChip>}
    >
      {radar.flags.length === 0 ? (
        <p className="text-sm text-muted">{t('radar.none')}</p>
      ) : (
        <DataTable headers={[t('radar.columnPattern'), t('budget.columnConsultant'), t('radar.columnDays'), t('radar.columnWhy')]}>
          {radar.flags.map((flag) => (
            <tr key={`${flag.kind}-${flag.consultantId}-${flag.days.join()}`}>
              <td>
                <StatusChip tone="signal">{t(RADAR_KIND_KEYS[flag.kind])}</StatusChip>
              </td>
              <td className="whitespace-nowrap">{flag.consultantName}</td>
              <td>{daysOf(flag)}</td>
              <td>{describe(flag)}</td>
            </tr>
          ))}
        </DataTable>
      )}
      <InfoNote>{t('radar.note')}</InfoNote>
    </Panel>
  )
}

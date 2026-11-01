// When the budget runs out, what follows from that, and what the figures assumed.
import { Button } from '../../../shared/components/Button.tsx'
import type { ApiError } from '../../../shared/api/getApiError.ts'
import { InfoNote } from '../../../shared/components/InfoNote.tsx'
import { MetricTile } from '../../../shared/components/MetricTile.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { ForecastResult, ForecastScenario, IsoWeek, OrderForecast } from '../budgetTypes.ts'
import { ForecastChart } from './ForecastChart.tsx'
import { ScenarioForm } from './ScenarioForm.tsx'

type ForecastPanelProps = {
  forecast: OrderForecast
  error: ApiError | null
  isLoading: boolean
  isRequestingFollowUp: boolean
  onScenario: (scenario: ForecastScenario) => void
  onResetScenario: () => void
  onRequestFollowUp: (personDays: number, neededByDate: string) => void
}

export function ForecastPanel({ forecast, error, isLoading, isRequestingFollowUp, onScenario, onResetScenario, onRequestFollowUp }: ForecastPanelProps) {
  const { t, formatDate, formatPersonDays } = useTranslation()

  const weekLabel = (week: IsoWeek | null) => (week ? t('forecast.week', { week: String(week.week), year: String(week.year) }) : t('forecast.notInSight'))

  if (forecast.status === 'not-enough-data') {
    return (
      <Panel title={t('forecast.panelTitle')}>
        <p className="text-sm font-semibold">{t('forecast.notEnoughData')}</p>
        <p className="mt-1 text-sm text-muted">{t('forecast.notEnoughDataHint')}</p>
      </Panel>
    )
  }

  const { base, scenario, openFollowUp } = forecast
  const { assumptions, warning } = base

  function comparisonRow(label: string, value: (result: ForecastResult) => string) {
    return (
      <tr>
        <th scope="row" className="text-left font-normal text-muted">{label}</th>
        <td>{value(base)}</td>
        <td className="font-bold">{scenario && value(scenario)}</td>
      </tr>
    )
  }

  return (
    <Panel
      title={t('forecast.panelTitle')}
      aside={warning ? <StatusChip tone="signal">{t('forecast.chipWarning')}</StatusChip> : <StatusChip tone="success">{t('forecast.chipOk')}</StatusChip>}
    >
      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <MetricTile label={t('forecast.runsOut')} value={weekLabel(base.exhaustionWeek)} />
        <MetricTile label={t('forecast.pace')} value={t('forecast.paceValue', { personDays: assumptions.pacePersonDaysPerWeek })} />
        <MetricTile label={t('forecast.atProjectEnd')} value={formatPersonDays(base.remainingAtProjectEndPersonDays)} />
      </div>

      {warning && (
        <div role="alert" className="mt-4 border border-signal-strong bg-signal-soft p-4 text-sm">
          <p className="font-bold text-signal-strong">
            {warning.isOverdue
              ? t('forecast.warningOverdue', { week: String(warning.orderByWeek.week) })
              : t('forecast.warning', { week: String(warning.orderByWeek.week) })}
          </p>
          <p className="mt-1">
            {t('forecast.warningDetail', { date: formatDate(base.exhaustionDate ?? ''), projectEnd: formatDate(base.projectEndDate) })}
          </p>
          {openFollowUp ? (
            <p className="mt-3 font-semibold">{t('forecast.followUpOpen', { personDays: formatPersonDays(openFollowUp.personDays) })}</p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="font-semibold">{t('forecast.followUpProposal', { personDays: formatPersonDays(warning.followUpPersonDays) })}</p>
              <Button variant="signal" disabled={isRequestingFollowUp} onClick={() => onRequestFollowUp(warning.followUpPersonDays, base.exhaustionDate ?? warning.orderByDate)}>
                {t('forecast.followUpRequest')}
              </Button>
            </div>
          )}
        </div>
      )}
      {!warning && <p className="mt-4 text-sm font-semibold text-success">{t('forecast.noWarning', { projectEnd: formatDate(base.projectEndDate) })}</p>}

      <div className="mt-5">
        <ForecastChart base={base} scenario={scenario} />
      </div>

      <InfoNote>
        {t('forecast.assumptions', {
          weeks: assumptions.paceWindowWeeks,
          consultants: assumptions.consultantCount,
          holidays: assumptions.holidayDays,
          vacations: assumptions.vacationDays,
          shutdowns: assumptions.shutdownDays,
          leadWeeks: assumptions.purchasingLeadWeeks,
        })}
      </InfoNote>

      <div className="mt-5">
        <ScenarioForm isLoading={isLoading} isActive={scenario !== null} onApply={onScenario} onReset={onResetScenario} />
        {error && (
          <StatusMessage tone="error" className="mt-3">
            {t(error.key, error.values)}
          </StatusMessage>
        )}
        {scenario && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm tabular-nums [&_td]:border-b [&_td]:border-line [&_td]:px-1.5 [&_td]:py-2 [&_th]:border-b [&_th]:border-line [&_th]:px-1.5 [&_th]:py-2">
              <thead>
                <tr className="text-left text-xs">
                  <td />
                  <th scope="col">{t('forecast.seriesBase')}</th>
                  <th scope="col">{t('forecast.seriesScenario')}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRow(t('forecast.runsOut'), (result) => weekLabel(result.exhaustionWeek))}
                {comparisonRow(t('forecast.projectEnd'), (result) => formatDate(result.projectEndDate))}
                {comparisonRow(t('forecast.atProjectEnd'), (result) => formatPersonDays(result.remainingAtProjectEndPersonDays))}
                {comparisonRow(t('forecast.orderBy'), (result) => (result.warning ? weekLabel(result.warning.orderByWeek) : '–'))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  )
}

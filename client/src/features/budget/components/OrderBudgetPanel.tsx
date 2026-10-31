import { MetricTile } from '../../../shared/components/MetricTile.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { ProgressBar } from '../../../shared/components/ProgressBar.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { OrderBudget } from '../budgetTypes.ts'

export function OrderBudgetPanel({ budget }: { budget: OrderBudget }) {
  const { t, formatPersonDays } = useTranslation()
  const usedPercent = budget.orderedPersonDays > 0 ? (budget.usedPersonDays / budget.orderedPersonDays) * 100 : 0

  return (
    <Panel title={t('budget.panelTitle', { orderId: budget.orderId })}>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <MetricTile label={t('budget.ordered')} value={formatPersonDays(budget.orderedPersonDays)} />
        <MetricTile label={t('budget.used')} value={formatPersonDays(budget.usedPersonDays)} />
        <MetricTile label={t('budget.free')} value={formatPersonDays(budget.freePersonDays)} />
      </div>
      <ProgressBar label={t('budget.usedProgressLabel')} percent={usedPercent} className="mt-5" />
    </Panel>
  )
}

import { MetricTile } from '../../../shared/components/MetricTile.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { ProgressBar } from '../../../shared/components/ProgressBar.tsx'
import { formatPersonDays } from '../../../shared/utils/formatters.ts'
import type { OrderBudget } from '../budgetTypes.ts'

export function OrderBudgetPanel({ budget }: { budget: OrderBudget }) {
  const usedPercent = budget.orderedPersonDays > 0 ? (budget.usedPersonDays / budget.orderedPersonDays) * 100 : 0

  return (
    <Panel title={`Budget — Auftrag ${budget.orderId}`}>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <MetricTile label="Bestellt" value={formatPersonDays(budget.orderedPersonDays)} />
        <MetricTile label="Verbraucht" value={formatPersonDays(budget.usedPersonDays)} />
        <MetricTile label="Frei" value={formatPersonDays(budget.freePersonDays)} />
      </div>
      <ProgressBar label="Verbrauchtes Budget" percent={usedPercent} className="mt-5" />
    </Panel>
  )
}

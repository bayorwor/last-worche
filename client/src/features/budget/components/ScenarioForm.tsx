// What if a consultant joins, or the project runs longer? Nothing here is stored.
import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/components/Button.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { ForecastScenario } from '../budgetTypes.ts'

type ScenarioFormProps = {
  isLoading: boolean
  isActive: boolean
  onApply: (scenario: ForecastScenario) => void
  onReset: () => void
}

const INPUT_CLASSES = 'mt-1 min-h-11 w-full min-w-0 border border-ink bg-paper px-2.5 py-2 text-base'
const LABEL_CLASSES = 'block text-xs font-semibold'

export function ScenarioForm({ isLoading, isActive, onApply, onReset }: ScenarioFormProps) {
  const { t } = useTranslation()
  const [extraConsultants, setExtraConsultants] = useState('')
  const [extraFromDate, setExtraFromDate] = useState('')
  const [shiftWeeks, setShiftWeeks] = useState('')
  const canApply = extraConsultants !== '' || shiftWeeks !== ''

  function apply(event: FormEvent) {
    event.preventDefault()
    onApply({
      extraConsultants: extraConsultants === '' ? undefined : Number(extraConsultants),
      extraFromDate: extraConsultants === '' || extraFromDate === '' ? undefined : extraFromDate,
      projectEndShiftWeeks: shiftWeeks === '' ? undefined : Number(shiftWeeks),
    })
  }

  function reset() {
    setExtraConsultants('')
    setExtraFromDate('')
    setShiftWeeks('')
    onReset()
  }

  return (
    <form onSubmit={apply} noValidate className="border-t border-line pt-4">
      <h3 className="text-xs font-semibold tracking-widest text-muted uppercase">{t('forecast.scenarioTitle')}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="scenario-consultants" className={LABEL_CLASSES}>{t('forecast.scenarioConsultants')}</label>
          <input id="scenario-consultants" type="number" inputMode="numeric" value={extraConsultants} onChange={(event) => setExtraConsultants(event.target.value)} className={INPUT_CLASSES} />
        </div>
        <div>
          <label htmlFor="scenario-from" className={LABEL_CLASSES}>{t('forecast.scenarioFrom')}</label>
          <input id="scenario-from" type="date" value={extraFromDate} onChange={(event) => setExtraFromDate(event.target.value)} className={INPUT_CLASSES} />
        </div>
        <div>
          <label htmlFor="scenario-weeks" className={LABEL_CLASSES}>{t('forecast.scenarioWeeks')}</label>
          <input id="scenario-weeks" type="number" inputMode="numeric" value={shiftWeeks} onChange={(event) => setShiftWeeks(event.target.value)} className={INPUT_CLASSES} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <Button type="submit" disabled={!canApply || isLoading}>{t('forecast.scenarioApply')}</Button>
        {isActive && <Button variant="ghost" onClick={reset}>{t('forecast.scenarioReset')}</Button>}
      </div>
      <p className="mt-2 text-xs text-muted">{t('forecast.scenarioNote')}</p>
    </form>
  )
}

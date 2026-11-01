// Every rule the server checked for this booking. Icon and text carry the result, never colour alone.
import { Button } from '../../../shared/components/Button.tsx'
import { ruleError } from '../../../shared/api/getApiError.ts'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { MessageKey } from '../../../shared/i18n/messages/de.ts'
import type { BookingCheckResult } from '../bookingTypes.ts'

const RULE_LABEL_KEYS: Record<string, MessageKey> = {
  'assigned-order': 'ruleCheck.assignedOrder',
  'order-period': 'ruleCheck.orderPeriod',
  'approved-month': 'ruleCheck.approvedMonth',
  'free-budget': 'ruleCheck.freeBudget',
  vacation: 'ruleCheck.vacation',
  'public-holiday': 'ruleCheck.publicHoliday',
  'no-overlap': 'ruleCheck.noOverlap',
  'daily-limit': 'ruleCheck.dailyLimit',
  'rest-period': 'ruleCheck.restPeriod',
}

type BookingRuleChecklistProps = {
  result: BookingCheckResult
  onUseSlot: (slot: { startTime: string; endTime: string }) => void
}

function PassedIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success">
      <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function FailedIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal-strong">
      <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function BookingRuleChecklist({ result, onUseSlot }: BookingRuleChecklistProps) {
  const { t, formatPersonDays } = useTranslation()
  const failedCount = result.checks.filter((check) => !check.passed).length

  return (
    <div className="mt-4 border-t border-line pt-3">
      <h4 className="text-xs font-semibold tracking-widest text-muted uppercase">{t('ruleCheck.title')}</h4>
      <p role="status" className="mt-1 text-sm font-semibold">
        {failedCount === 0 ? t('ruleCheck.allPassed', { count: result.checks.length }) : t('ruleCheck.someFailed', { count: failedCount })}
      </p>
      <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
        {result.checks.map((check) => {
          const label = RULE_LABEL_KEYS[check.name]
          const error = check.passed ? null : ruleError(check.rule, check.values, check.message)
          return (
            <li key={check.name} className={`flex gap-2 ${check.passed ? '' : 'font-semibold text-signal-strong sm:col-span-2'}`}>
              {check.passed ? <PassedIcon /> : <FailedIcon />}
              <span className="sr-only">{check.passed ? t('ruleCheck.passed') : t('ruleCheck.failed')}:</span>
              <span>{error ? t(error.key, error.values) : label ? t(label) : check.name}</span>
            </li>
          )
        })}
      </ul>
      {result.suggestedSlot && (
        <Button variant="ghost" className="mt-3" onClick={() => result.suggestedSlot && onUseSlot(result.suggestedSlot)}>
          {t('ruleCheck.useSlot', result.suggestedSlot)}
        </Button>
      )}
      {failedCount === 0 && (
        <p className="mt-2 text-sm text-muted">{t('ruleCheck.freeAfter', { personDays: formatPersonDays(result.freePersonDaysAfter) })}</p>
      )}
    </div>
  )
}

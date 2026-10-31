import { describe, expect, test } from 'bun:test'
import { translate } from './translate.ts'

describe('translate', () => {
  test('returns the text in the chosen language', () => {
    expect(translate('de', 'budget.free')).toBe('Frei')
    expect(translate('en', 'budget.free')).toBe('Free')
  })

  test('fills in values and writes numbers the local way', () => {
    const values = { hours: 4.5, orderId: '4500012345', freePersonDays: 0.5 }

    expect(translate('de', 'errors.ruleFreeBudget', values)).toBe(
      'Diese Buchung benötigt 4,5 h, aber Auftrag 4500012345 hat nur noch 0,5 PT frei.',
    )
    expect(translate('en', 'errors.ruleFreeBudget', values)).toBe(
      'This booking needs 4.5 h, but order 4500012345 only has 0.5 PD free.',
    )
  })

  test('keeps a placeholder that has no value, so the mistake is visible', () => {
    expect(translate('en', 'bookings.proposalOrder')).toBe('Order {orderId}')
  })
})

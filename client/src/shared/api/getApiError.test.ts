import { describe, expect, test } from 'bun:test'
import { FALLBACK_API_ERROR, getApiError } from './getApiError.ts'

function failedRequest(status: number, data: unknown) {
  return { isAxiosError: true, response: { status, data } }
}

describe('getApiError', () => {
  test('passes on the values of a rejected business rule', () => {
    const values = { orderId: '4500012345', freePersonDays: 0.5 }

    expect(getApiError(failedRequest(422, { rule: 'free-budget', values }))).toEqual({
      key: 'errors.ruleFreeBudget',
      values,
    })
  })

  test('explains which input was invalid', () => {
    const invalidDescription = { details: [{ path: ['description'] }] }

    expect(getApiError(failedRequest(400, invalidDescription))).toEqual({ key: 'errors.descriptionRequired' })
    expect(getApiError(failedRequest(400, {}))).toEqual({ key: 'errors.invalidInput' })
  })

  test('shows the server text for a rule without a translation', () => {
    expect(getApiError(failedRequest(422, { rule: 'new-rule', error: 'Not allowed.' }))).toEqual({
      key: 'errors.fromServer',
      values: { message: 'Not allowed.' },
    })
  })

  test('tells a wrong password apart from an ended session', () => {
    expect(getApiError(failedRequest(401, { code: 'invalid-credentials' }))).toEqual({ key: 'errors.invalidCredentials' })
    expect(getApiError(failedRequest(400, { details: [{ path: ['email'] }] }))).toEqual({ key: 'errors.invalidEmail' })
  })

  test('explains a missing session and a missing permission', () => {
    expect(getApiError(failedRequest(401, {}))).toEqual({ key: 'errors.sessionEnded' })
    expect(getApiError(failedRequest(403, {}))).toEqual({ key: 'errors.forbidden' })
  })

  test('tells the AI errors apart by their code', () => {
    expect(getApiError(failedRequest(503, { code: 'ai-busy' }))).toEqual({ key: 'errors.aiBusy' })
  })

  test('uses the fallback when the server cannot be reached', () => {
    expect(getApiError(new Error('Network Error'))).toEqual(FALLBACK_API_ERROR)
    expect(getApiError({ isAxiosError: true })).toEqual(FALLBACK_API_ERROR)
  })
})

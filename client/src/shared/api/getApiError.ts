// Turns a failed request into a message key, not finished text. The text is chosen when it is shown,
// so a visible error changes language together with the rest of the page.
import axios from 'axios'
import type { MessageKey } from '../i18n/messages/de.ts'
import type { MessageValues } from '../i18n/translate.ts'

export type ApiError = {
  key: MessageKey
  values?: MessageValues
}

type ApiErrorBody = {
  error?: string
  rule?: string
  code?: string
  values?: MessageValues
  details?: { path?: (string | number)[] }[]
}

export const FALLBACK_API_ERROR: ApiError = { key: 'errors.serverUnavailable' }

const RULE_MESSAGE_KEYS: Record<string, MessageKey> = {
  'free-budget': 'errors.ruleFreeBudget',
  'assigned-order': 'errors.ruleAssignedOrder',
  'no-overlap': 'errors.ruleOverlap',
  'proof-approved': 'errors.ruleProofApproved',
  'proof-already-approved': 'errors.ruleProofAlreadyApproved',
  'proof-empty': 'errors.ruleProofEmpty',
  'daily-limit': 'errors.ruleDailyLimit',
  'rest-after-previous-day': 'errors.ruleRestAfterPreviousDay',
  'rest-before-next-day': 'errors.ruleRestBeforeNextDay',
}

// Which input field the server's validation complained about first.
const FIELD_MESSAGE_KEYS: Record<string, MessageKey> = {
  email: 'errors.invalidEmail',
  code: 'errors.invalidCode',
  description: 'errors.descriptionRequired',
  hours: 'errors.invalidDuration',
  startTime: 'errors.invalidTimes',
  endTime: 'errors.invalidTimes',
}

const AI_ERROR_MESSAGE_KEYS: Record<string, MessageKey> = {
  'ai-unavailable': 'errors.aiUnavailable',
  'ai-busy': 'errors.aiBusy',
  'ai-unreadable': 'errors.aiUnreadable',
}

export function getApiError(error: unknown): ApiError {
  if (!axios.isAxiosError<ApiErrorBody>(error) || !error.response) {
    return FALLBACK_API_ERROR
  }

  const { status, data } = error.response

  if (status === 422 && data?.rule) {
    const ruleMessageKey = RULE_MESSAGE_KEYS[data.rule]
    if (ruleMessageKey) {
      return { key: ruleMessageKey, values: data.values }
    }
    // A rule without a translation yet: the server's English text still names why the booking failed.
    return { key: 'errors.fromServer', values: { message: data.error ?? data.rule } }
  }

  if (status === 503 && data?.code && AI_ERROR_MESSAGE_KEYS[data.code]) {
    return { key: AI_ERROR_MESSAGE_KEYS[data.code] }
  }
  if (status === 400) {
    const invalidField = String(data?.details?.[0]?.path?.[0])
    return { key: FIELD_MESSAGE_KEYS[invalidField] ?? 'errors.invalidInput' }
  }
  if (status === 401 && data?.code === 'invalid-code') {
    return { key: 'errors.invalidCode' }
  }
  if (status === 401) {
    return { key: 'errors.sessionEnded' }
  }
  if (status === 403) {
    return { key: 'errors.forbidden' }
  }
  if (status === 404) {
    return { key: 'errors.orderNotFound' }
  }
  return FALLBACK_API_ERROR
}

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
}

export const FALLBACK_API_ERROR: ApiError = { key: 'errors.serverUnavailable' }

const RULE_MESSAGE_KEYS: Record<string, MessageKey> = {
  'free-budget': 'errors.ruleFreeBudget',
  'assigned-order': 'errors.ruleAssignedOrder',
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
    return { key: 'errors.invalidInput' }
  }
  if (status === 404) {
    return { key: 'errors.orderNotFound' }
  }
  return FALLBACK_API_ERROR
}

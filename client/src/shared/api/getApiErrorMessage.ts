// Prefers the backend's own message, because it names the business rule that rejected a request.
import axios from 'axios'

export const FALLBACK_ERROR_MESSAGE = 'Der Server ist gerade nicht erreichbar. Bitte versuchen Sie es erneut.'

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(error) && error.response?.data?.error) {
    return error.response.data.error
  }
  return FALLBACK_ERROR_MESSAGE
}

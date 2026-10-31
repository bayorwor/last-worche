// Keeps the signed session token on this device, so a reload stays signed in. Storage can be blocked,
// for example in a private window. Signing in then lasts only until the page is reloaded.
const STORAGE_KEY = 'lastWorche.sessionToken'

let tokenInMemory: string | null = null

export function readSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? tokenInMemory
  } catch {
    return tokenInMemory
  }
}

export function saveSessionToken(token: string) {
  tokenInMemory = token
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // The copy in memory still works until the page is reloaded.
  }
}

export function clearSessionToken() {
  tokenInMemory = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to remove when storage is blocked.
  }
}

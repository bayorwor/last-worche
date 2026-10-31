import { combineReducers, configureStore } from '@reduxjs/toolkit'
import axios from 'axios'
import { authReducer, signedOut } from '../features/auth/authSlice.ts'
import { bookingsReducer } from '../features/bookings/bookingsSlice.ts'
import { budgetReducer } from '../features/budget/budgetSlice.ts'
import { apiClient } from '../shared/api/apiClient.ts'
import { clearSessionToken, readSessionToken } from '../shared/api/sessionToken.ts'

const appReducer = combineReducers({
  auth: authReducer,
  bookings: bookingsReducer,
  budget: budgetReducer,
})

// Signing out empties everything else, so the next user on this device never sees the last user's data.
const rootReducer: typeof appReducer = (state, action) =>
  appReducer(signedOut.match(action) && state ? ({ auth: state.auth } as typeof state) : state, action)

export const store = configureStore({ reducer: rootReducer })

// The server answers 401 when a session has ended, for example after 8 hours. Without a session,
// a 401 is just a wrong sign-in code, which the sign-in screen explains itself.
apiClient.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && readSessionToken()) {
    clearSessionToken()
    store.dispatch(signedOut())
  }
  return Promise.reject(error)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

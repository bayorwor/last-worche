import { combineReducers, configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import axios from 'axios'
import { activityReducer, fetchRecentActivity } from '../features/activity/activitySlice.ts'
import { authReducer, saveProfile, signedOut } from '../features/auth/authSlice.ts'
import { bookingsReducer, confirmBookingProposal } from '../features/bookings/bookingsSlice.ts'
import { approveProofOfWork, budgetReducer } from '../features/budget/budgetSlice.ts'
import { purchasingReducer } from '../features/purchasing/purchasingSlice.ts'
import { apiClient } from '../shared/api/apiClient.ts'
import { clearSessionToken, readSessionToken } from '../shared/api/sessionToken.ts'

const appReducer = combineReducers({
  activity: activityReducer,
  auth: authReducer,
  bookings: bookingsReducer,
  budget: budgetReducer,
  purchasing: purchasingReducer,
})

// Signing out empties everything else, so the next user on this device never sees the last user's data.
const rootReducer: typeof appReducer = (state, action) =>
  appReducer(signedOut.match(action) && state ? ({ auth: state.auth } as typeof state) : state, action)

// Features may not import each other, so the connection "this changes the activity list" is made here.
const activityRefresh = createListenerMiddleware()
activityRefresh.startListening({
  matcher: isAnyOf(confirmBookingProposal.fulfilled, approveProofOfWork.fulfilled, saveProfile.fulfilled),
  effect: (_action, { dispatch }) => {
    dispatch(fetchRecentActivity())
  },
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(activityRefresh.middleware),
})

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

import { configureStore } from '@reduxjs/toolkit'
import { bookingsReducer } from '../features/bookings/bookingsSlice.ts'
import { budgetReducer } from '../features/budget/budgetSlice.ts'

export const store = configureStore({
  reducer: {
    bookings: bookingsReducer,
    budget: budgetReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_ERROR_MESSAGE, getApiErrorMessage } from '../../shared/api/getApiErrorMessage.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { createBooking, requestBookingProposal } from './bookingsApi.ts'
import type { Booking, BookingProposal } from './bookingTypes.ts'

type BookingsState = {
  proposal: BookingProposal | null
  confirmedBookings: Booking[]
  proposalStatus: RequestStatus
  confirmationStatus: RequestStatus
  errorMessage: string | null
}

const initialState: BookingsState = {
  proposal: null,
  confirmedBookings: [],
  proposalStatus: 'idle',
  confirmationStatus: 'idle',
  errorMessage: null,
}

export const fetchBookingProposal = createAsyncThunk<BookingProposal, string, { rejectValue: string }>(
  'bookings/fetchBookingProposal',
  async (sentence, { rejectWithValue }) => {
    try {
      return await requestBookingProposal(sentence)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error))
    }
  },
)

export const confirmBookingProposal = createAsyncThunk<Booking, BookingProposal, { rejectValue: string }>(
  'bookings/confirmBookingProposal',
  async (proposal, { rejectWithValue }) => {
    try {
      return await createBooking(proposal)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error))
    }
  },
)

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    proposalDiscarded(state) {
      state.proposal = null
      state.confirmationStatus = 'idle'
      state.errorMessage = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingProposal.pending, (state) => {
        state.proposalStatus = 'loading'
        state.confirmationStatus = 'idle'
        state.errorMessage = null
      })
      .addCase(fetchBookingProposal.fulfilled, (state, action) => {
        state.proposalStatus = 'succeeded'
        state.proposal = action.payload
      })
      .addCase(fetchBookingProposal.rejected, (state, action) => {
        state.proposalStatus = 'failed'
        state.errorMessage = action.payload ?? FALLBACK_ERROR_MESSAGE
      })
      .addCase(confirmBookingProposal.pending, (state) => {
        state.confirmationStatus = 'loading'
        state.errorMessage = null
      })
      .addCase(confirmBookingProposal.fulfilled, (state, action) => {
        state.confirmationStatus = 'succeeded'
        state.proposal = null
        state.confirmedBookings.push(action.payload)
      })
      .addCase(confirmBookingProposal.rejected, (state, action) => {
        state.confirmationStatus = 'failed'
        state.errorMessage = action.payload ?? FALLBACK_ERROR_MESSAGE
      })
  },
})

export const { proposalDiscarded } = bookingsSlice.actions
export const bookingsReducer = bookingsSlice.reducer

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { OrderSummary } from '../../shared/api/orderSummary.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { createBooking, requestAssignedOrders, requestBookingProposal } from './bookingsApi.ts'
import type { Booking, BookingProposal } from './bookingTypes.ts'

type BookingsState = {
  assignedOrders: OrderSummary[]
  assignedOrdersStatus: RequestStatus
  proposal: BookingProposal | null
  confirmedBookings: Booking[]
  proposalStatus: RequestStatus
  confirmationStatus: RequestStatus
  error: ApiError | null
}

const initialState: BookingsState = {
  assignedOrders: [],
  assignedOrdersStatus: 'idle',
  proposal: null,
  confirmedBookings: [],
  proposalStatus: 'idle',
  confirmationStatus: 'idle',
  error: null,
}

export const fetchAssignedOrders = createAsyncThunk<OrderSummary[], void, { rejectValue: ApiError }>(
  'bookings/fetchAssignedOrders',
  async (_, { rejectWithValue }) => {
    try {
      return await requestAssignedOrders()
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const fetchBookingProposal = createAsyncThunk<BookingProposal, string, { rejectValue: ApiError }>(
  'bookings/fetchBookingProposal',
  async (sentence, { rejectWithValue }) => {
    try {
      return await requestBookingProposal(sentence)
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const confirmBookingProposal = createAsyncThunk<
  Booking,
  { proposal: BookingProposal; orderId: string },
  { rejectValue: ApiError }
>(
  'bookings/confirmBookingProposal',
  async ({ proposal, orderId }, { rejectWithValue }) => {
    try {
      return await createBooking(proposal, orderId)
    } catch (error) {
      return rejectWithValue(getApiError(error))
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
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignedOrders.pending, (state) => {
        state.assignedOrdersStatus = 'loading'
      })
      .addCase(fetchAssignedOrders.fulfilled, (state, action) => {
        state.assignedOrdersStatus = 'succeeded'
        state.assignedOrders = action.payload
      })
      .addCase(fetchAssignedOrders.rejected, (state, action) => {
        state.assignedOrdersStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(fetchBookingProposal.pending, (state) => {
        state.proposalStatus = 'loading'
        state.confirmationStatus = 'idle'
        state.error = null
      })
      .addCase(fetchBookingProposal.fulfilled, (state, action) => {
        state.proposalStatus = 'succeeded'
        state.proposal = action.payload
      })
      .addCase(fetchBookingProposal.rejected, (state, action) => {
        state.proposalStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(confirmBookingProposal.pending, (state) => {
        state.confirmationStatus = 'loading'
        state.error = null
      })
      .addCase(confirmBookingProposal.fulfilled, (state, action) => {
        state.confirmationStatus = 'succeeded'
        state.proposal = null
        state.confirmedBookings.push(action.payload)
      })
      .addCase(confirmBookingProposal.rejected, (state, action) => {
        state.confirmationStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
  },
})

export const { proposalDiscarded } = bookingsSlice.actions
export const bookingsReducer = bookingsSlice.reducer

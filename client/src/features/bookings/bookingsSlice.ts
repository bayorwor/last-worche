import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { OrderSummary } from '../../shared/api/orderSummary.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { createBooking, requestAssignedOrders, requestBookingCheck, requestBookingProposal, requestOwnBookings } from './bookingsApi.ts'
import type { Booking, BookingCheckResult, BookingProposal } from './bookingTypes.ts'

type BookingsState = {
  assignedOrders: OrderSummary[]
  assignedOrdersStatus: RequestStatus
  proposal: BookingProposal | null
  ownBookings: Booking[]
  proposalStatus: RequestStatus
  confirmationStatus: RequestStatus
  error: ApiError | null
  checkResult: BookingCheckResult | null
  checkError: ApiError | null
  // Only the latest check counts, because an older answer can arrive after a newer one.
  latestCheckRequestId: string | null
}

const initialState: BookingsState = {
  assignedOrders: [],
  assignedOrdersStatus: 'idle',
  proposal: null,
  ownBookings: [],
  proposalStatus: 'idle',
  confirmationStatus: 'idle',
  error: null,
  checkResult: null,
  checkError: null,
  latestCheckRequestId: null,
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

export const fetchOwnBookings = createAsyncThunk<Booking[], string, { rejectValue: ApiError }>(
  'bookings/fetchOwnBookings',
  async (consultantId, { rejectWithValue }) => {
    try {
      return await requestOwnBookings(consultantId)
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

export const fetchBookingCheck = createAsyncThunk<BookingCheckResult, { proposal: BookingProposal; orderId: string }, { rejectValue: ApiError }>(
  'bookings/fetchBookingCheck',
  async ({ proposal, orderId }, { rejectWithValue }) => {
    try {
      return await requestBookingCheck(proposal, orderId)
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
      state.checkResult = null
      state.checkError = null
    },
    proposalEdited(state, action: PayloadAction<Partial<BookingProposal>>) {
      if (state.proposal) {
        state.proposal = { ...state.proposal, ...action.payload }
        state.confirmationStatus = 'idle'
        state.error = null
      }
    },
    manualBookingStarted(state, action: PayloadAction<string>) {
      state.proposal = { date: action.payload, startTime: '09:00', endTime: '17:00', hours: 7, description: '' }
      state.confirmationStatus = 'idle'
      state.error = null
      state.checkResult = null
      state.checkError = null
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
      .addCase(fetchOwnBookings.fulfilled, (state, action) => {
        state.ownBookings = action.payload
      })
      .addCase(fetchOwnBookings.rejected, (state, action) => {
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
        state.checkResult = null
        state.checkError = null
      })
      .addCase(fetchBookingProposal.rejected, (state, action) => {
        state.proposalStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(fetchBookingCheck.pending, (state, action) => {
        state.latestCheckRequestId = action.meta.requestId
      })
      .addCase(fetchBookingCheck.fulfilled, (state, action) => {
        if (state.latestCheckRequestId === action.meta.requestId) {
          state.checkResult = action.payload
          state.checkError = null
        }
      })
      .addCase(fetchBookingCheck.rejected, (state, action) => {
        if (state.latestCheckRequestId === action.meta.requestId) {
          state.checkResult = null
          state.checkError = action.payload ?? FALLBACK_API_ERROR
        }
      })
      .addCase(confirmBookingProposal.pending, (state) => {
        state.confirmationStatus = 'loading'
        state.error = null
      })
      .addCase(confirmBookingProposal.fulfilled, (state, action) => {
        state.confirmationStatus = 'succeeded'
        state.proposal = null
        state.checkResult = null
        state.ownBookings.unshift(action.payload)
      })
      .addCase(confirmBookingProposal.rejected, (state, action) => {
        state.confirmationStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
  },
})

export const { manualBookingStarted, proposalDiscarded, proposalEdited } = bookingsSlice.actions
export const bookingsReducer = bookingsSlice.reducer

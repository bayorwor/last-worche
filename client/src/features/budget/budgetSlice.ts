import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { OrderSummary } from '../../shared/api/orderSummary.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import {
  requestFollowUpOrder,
  requestOrderBookings,
  requestOrderBudget,
  requestOrderForecast,
  requestOrders,
  requestProofApproval,
  requestProofsOfWork,
} from './budgetApi.ts'
import type { ForecastScenario, OrderBooking, OrderBudget, OrderForecast, ProofOfWork } from './budgetTypes.ts'

type BudgetState = {
  orders: OrderSummary[]
  // Per order, so a slow answer for one order can never appear under another.
  budgetsByOrderId: Record<string, OrderBudget>
  bookingsByOrderId: Record<string, OrderBooking[]>
  proofsByOrderId: Record<string, ProofOfWork[]>
  forecastsByOrderId: Record<string, OrderForecast>
  forecastStatus: RequestStatus
  forecastError: ApiError | null
  followUpStatus: RequestStatus
  approvalStatus: RequestStatus
  status: RequestStatus
  error: ApiError | null
}

const initialState: BudgetState = {
  orders: [],
  budgetsByOrderId: {},
  bookingsByOrderId: {},
  proofsByOrderId: {},
  forecastsByOrderId: {},
  forecastStatus: 'idle',
  forecastError: null,
  followUpStatus: 'idle',
  approvalStatus: 'idle',
  status: 'idle',
  error: null,
}

export const fetchOrders = createAsyncThunk<OrderSummary[], void, { rejectValue: ApiError }>(
  'budget/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      return await requestOrders()
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const fetchOrderBookings = createAsyncThunk<OrderBooking[], string, { rejectValue: ApiError }>(
  'budget/fetchOrderBookings',
  async (orderId, { rejectWithValue }) => {
    try {
      return await requestOrderBookings(orderId)
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const fetchProofsOfWork = createAsyncThunk<ProofOfWork[], string, { rejectValue: ApiError }>(
  'budget/fetchProofsOfWork',
  async (orderId, { rejectWithValue }) => {
    try {
      return await requestProofsOfWork(orderId)
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const approveProofOfWork = createAsyncThunk<ProofOfWork[], { orderId: string; month: string }, { rejectValue: ApiError }>(
  'budget/approveProofOfWork',
  async ({ orderId, month }, { rejectWithValue }) => {
    try {
      return await requestProofApproval(orderId, month)
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const fetchOrderBudget = createAsyncThunk<OrderBudget, string, { rejectValue: ApiError }>(
  'budget/fetchOrderBudget',
  async (orderId, { rejectWithValue }) => {
    try {
      return await requestOrderBudget(orderId)
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const fetchOrderForecast = createAsyncThunk<OrderForecast, { orderId: string; scenario?: ForecastScenario }, { rejectValue: ApiError }>(
  'budget/fetchOrderForecast',
  async ({ orderId, scenario }, { rejectWithValue }) => {
    try {
      return await requestOrderForecast(orderId, scenario)
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const requestFollowUp = createAsyncThunk<void, { orderId: string; personDays: number; neededByDate: string }, { rejectValue: ApiError }>(
  'budget/requestFollowUp',
  async ({ orderId, personDays, neededByDate }, { dispatch, rejectWithValue }) => {
    try {
      await requestFollowUpOrder(orderId, personDays, neededByDate)
      await dispatch(fetchOrderForecast({ orderId }))
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

// Everything the project lead's tabs show about one order.
export const loadOrder = createAsyncThunk<void, string>('budget/loadOrder', async (orderId, { dispatch }) => {
  await Promise.all([
    dispatch(fetchOrderBudget(orderId)),
    dispatch(fetchOrderBookings(orderId)),
    dispatch(fetchProofsOfWork(orderId)),
    dispatch(fetchOrderForecast({ orderId })),
  ])
})

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.orders = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(fetchOrderBookings.fulfilled, (state, action) => {
        state.bookingsByOrderId[action.meta.arg] = action.payload
      })
      .addCase(fetchOrderBookings.rejected, (state, action) => {
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(fetchProofsOfWork.fulfilled, (state, action) => {
        state.proofsByOrderId[action.meta.arg] = action.payload
      })
      .addCase(fetchProofsOfWork.rejected, (state, action) => {
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(approveProofOfWork.pending, (state) => {
        state.approvalStatus = 'loading'
        state.error = null
      })
      .addCase(approveProofOfWork.fulfilled, (state, action) => {
        state.approvalStatus = 'succeeded'
        state.proofsByOrderId[action.meta.arg.orderId] = action.payload
      })
      .addCase(approveProofOfWork.rejected, (state, action) => {
        state.approvalStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(fetchOrderForecast.pending, (state) => {
        state.forecastStatus = 'loading'
        state.forecastError = null
      })
      .addCase(fetchOrderForecast.fulfilled, (state, action) => {
        state.forecastStatus = 'succeeded'
        state.forecastsByOrderId[action.meta.arg.orderId] = action.payload
      })
      // The last forecast stays on screen: an invalid scenario must not change it.
      .addCase(fetchOrderForecast.rejected, (state, action) => {
        state.forecastStatus = 'failed'
        state.forecastError = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(requestFollowUp.pending, (state) => {
        state.followUpStatus = 'loading'
        state.forecastError = null
      })
      .addCase(requestFollowUp.fulfilled, (state) => {
        state.followUpStatus = 'succeeded'
      })
      .addCase(requestFollowUp.rejected, (state, action) => {
        state.followUpStatus = 'failed'
        state.forecastError = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(fetchOrderBudget.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchOrderBudget.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.budgetsByOrderId[action.payload.orderId] = action.payload
      })
      .addCase(fetchOrderBudget.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
  },
})

export const budgetReducer = budgetSlice.reducer

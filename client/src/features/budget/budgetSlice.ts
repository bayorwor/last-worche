import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { OrderSummary } from '../../shared/api/orderSummary.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { requestOrderBookings, requestOrderBudget, requestOrders } from './budgetApi.ts'
import type { OrderBooking, OrderBudget } from './budgetTypes.ts'

type BudgetState = {
  orders: OrderSummary[]
  // Per order, so a slow answer for one order can never appear under another.
  budgetsByOrderId: Record<string, OrderBudget>
  bookingsByOrderId: Record<string, OrderBooking[]>
  status: RequestStatus
  error: ApiError | null
}

const initialState: BudgetState = {
  orders: [],
  budgetsByOrderId: {},
  bookingsByOrderId: {},
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

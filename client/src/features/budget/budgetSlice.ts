import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_ERROR_MESSAGE, getApiErrorMessage } from '../../shared/api/getApiErrorMessage.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { requestOrderBudget } from './budgetApi.ts'
import type { OrderBudget } from './budgetTypes.ts'

type BudgetState = {
  orderBudget: OrderBudget | null
  status: RequestStatus
  errorMessage: string | null
}

const initialState: BudgetState = {
  orderBudget: null,
  status: 'idle',
  errorMessage: null,
}

export const fetchOrderBudget = createAsyncThunk<OrderBudget, string, { rejectValue: string }>(
  'budget/fetchOrderBudget',
  async (orderId, { rejectWithValue }) => {
    try {
      return await requestOrderBudget(orderId)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error))
    }
  },
)

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderBudget.pending, (state) => {
        state.status = 'loading'
        state.errorMessage = null
      })
      .addCase(fetchOrderBudget.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.orderBudget = action.payload
      })
      .addCase(fetchOrderBudget.rejected, (state, action) => {
        state.status = 'failed'
        state.errorMessage = action.payload ?? FALLBACK_ERROR_MESSAGE
      })
  },
})

export const budgetReducer = budgetSlice.reducer

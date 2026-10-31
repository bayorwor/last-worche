import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { requestSupplierOverview } from './purchasingApi.ts'
import type { SupplierOverview } from './purchasingTypes.ts'

type PurchasingState = {
  suppliers: SupplierOverview[]
  status: RequestStatus
  error: ApiError | null
}

const initialState: PurchasingState = {
  suppliers: [],
  status: 'idle',
  error: null,
}

export const fetchSupplierOverview = createAsyncThunk<SupplierOverview[], void, { rejectValue: ApiError }>(
  'purchasing/fetchSupplierOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await requestSupplierOverview()
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

const purchasingSlice = createSlice({
  name: 'purchasing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupplierOverview.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchSupplierOverview.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.suppliers = action.payload
      })
      .addCase(fetchSupplierOverview.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
  },
})

export const purchasingReducer = purchasingSlice.reducer

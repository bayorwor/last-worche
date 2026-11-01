import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { requestFollowUpConfirmation, requestFollowUpRequests, requestSupplierOverview } from './purchasingApi.ts'
import type { FollowUpRequest, SupplierOverview } from './purchasingTypes.ts'

type PurchasingState = {
  suppliers: SupplierOverview[]
  status: RequestStatus
  error: ApiError | null
  followUps: FollowUpRequest[]
  followUpStatus: RequestStatus
}

const initialState: PurchasingState = {
  suppliers: [],
  status: 'idle',
  error: null,
  followUps: [],
  followUpStatus: 'idle',
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

export const fetchFollowUps = createAsyncThunk<FollowUpRequest[], void, { rejectValue: ApiError }>(
  'purchasing/fetchFollowUps',
  async (_, { rejectWithValue }) => {
    try {
      return await requestFollowUpRequests()
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const confirmFollowUp = createAsyncThunk<FollowUpRequest[], number, { rejectValue: ApiError }>(
  'purchasing/confirmFollowUp',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const followUps = await requestFollowUpConfirmation(id)
      dispatch(fetchSupplierOverview())
      return followUps
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
      .addCase(fetchFollowUps.fulfilled, (state, action) => {
        state.followUps = action.payload
      })
      .addCase(fetchFollowUps.rejected, (state, action) => {
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(confirmFollowUp.pending, (state) => {
        state.followUpStatus = 'loading'
        state.error = null
      })
      .addCase(confirmFollowUp.fulfilled, (state, action) => {
        state.followUpStatus = 'succeeded'
        state.followUps = action.payload
      })
      .addCase(confirmFollowUp.rejected, (state, action) => {
        state.followUpStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
  },
})

export const purchasingReducer = purchasingSlice.reducer

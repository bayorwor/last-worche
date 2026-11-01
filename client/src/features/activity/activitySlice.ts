import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { requestRecentActivity } from './activityApi.ts'
import type { Activity } from './activityTypes.ts'

type ActivityState = {
  entries: Activity[]
  status: RequestStatus
  error: ApiError | null
}

const initialState: ActivityState = {
  entries: [],
  status: 'idle',
  error: null,
}

export const fetchRecentActivity = createAsyncThunk<Activity[], void, { rejectValue: ApiError }>(
  'activity/fetchRecentActivity',
  async (_, { rejectWithValue }) => {
    try {
      return await requestRecentActivity()
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentActivity.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.entries = action.payload
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
  },
})

export const activityReducer = activitySlice.reducer

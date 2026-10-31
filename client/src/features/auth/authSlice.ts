import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { clearSessionToken, readSessionToken, saveSessionToken } from '../../shared/api/sessionToken.ts'
import { requestCurrentUser, requestDemoUsers, requestSignIn } from './authApi.ts'
import type { DemoUser, SessionUser } from './authTypes.ts'

// 'checking' means a token was found and the server has not yet confirmed it.
type SessionStatus = 'checking' | 'signedIn' | 'signedOut'

type AuthState = {
  sessionStatus: SessionStatus
  user: SessionUser | null
  demoUsers: DemoUser[]
  demoUsersStatus: RequestStatus
  signInStatus: RequestStatus
  error: ApiError | null
}

const initialState: AuthState = {
  sessionStatus: readSessionToken() ? 'checking' : 'signedOut',
  user: null,
  demoUsers: [],
  demoUsersStatus: 'idle',
  signInStatus: 'idle',
  error: null,
}

export const fetchDemoUsers = createAsyncThunk<DemoUser[], void, { rejectValue: ApiError }>(
  'auth/fetchDemoUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await requestDemoUsers()
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const signIn = createAsyncThunk<SessionUser, string, { rejectValue: ApiError }>(
  'auth/signIn',
  async (userId, { rejectWithValue }) => {
    try {
      const { token, user } = await requestSignIn(userId)
      saveSessionToken(token)
      return user
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

export const restoreSession = createAsyncThunk<SessionUser, void>('auth/restoreSession', async () => {
  try {
    return await requestCurrentUser()
  } catch (error) {
    clearSessionToken()
    throw error
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedOut(state) {
      state.sessionStatus = 'signedOut'
      state.user = null
      state.signInStatus = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDemoUsers.pending, (state) => {
        state.demoUsersStatus = 'loading'
        state.error = null
      })
      .addCase(fetchDemoUsers.fulfilled, (state, action) => {
        state.demoUsersStatus = 'succeeded'
        state.demoUsers = action.payload
      })
      .addCase(fetchDemoUsers.rejected, (state, action) => {
        state.demoUsersStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(signIn.pending, (state) => {
        state.signInStatus = 'loading'
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.signInStatus = 'succeeded'
        state.sessionStatus = 'signedIn'
        state.user = action.payload
      })
      .addCase(signIn.rejected, (state, action) => {
        state.signInStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.sessionStatus = 'signedIn'
        state.user = action.payload
      })
      .addCase(restoreSession.rejected, (state) => {
        state.sessionStatus = 'signedOut'
        state.user = null
      })
  },
})

export const { signedOut } = authSlice.actions
export const authReducer = authSlice.reducer

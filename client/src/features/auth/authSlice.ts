import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { clearSessionToken, readSessionToken, saveSessionToken } from '../../shared/api/sessionToken.ts'
import { requestCurrentUser, requestRoles, requestSignIn, requestTestAccounts } from './authApi.ts'
import type { Credentials, Role, SessionUser, TestAccounts } from './authTypes.ts'

// 'checking' means a token was found and the server has not yet confirmed it.
type SessionStatus = 'checking' | 'signedIn' | 'signedOut'

type AuthState = {
  sessionStatus: SessionStatus
  user: SessionUser | null
  roles: Role[]
  testAccounts: TestAccounts | null
  signInStatus: RequestStatus
  error: ApiError | null
}

const initialState: AuthState = {
  sessionStatus: readSessionToken() ? 'checking' : 'signedOut',
  user: null,
  roles: [],
  testAccounts: null,
  signInStatus: 'idle',
  error: null,
}

export const fetchRoles = createAsyncThunk<Role[], void>('auth/fetchRoles', () => requestRoles())

// The list is optional, so a failure just leaves it out. It fails on purpose when switched off on the server.
export const fetchTestAccounts = createAsyncThunk<TestAccounts, void>('auth/fetchTestAccounts', () => requestTestAccounts())

export const signIn = createAsyncThunk<SessionUser, Credentials, { rejectValue: ApiError }>(
  'auth/signIn',
  async (credentials, { rejectWithValue }) => {
    try {
      const { token, user } = await requestSignIn(credentials)
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
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload
      })
      .addCase(fetchTestAccounts.fulfilled, (state, action) => {
        state.testAccounts = action.payload
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

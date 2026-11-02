import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_API_ERROR, getApiError, type ApiError } from '../../shared/api/getApiError.ts'
import type { RequestStatus } from '../../shared/api/requestStatus.ts'
import { clearSessionToken, readSessionToken, saveSessionToken } from '../../shared/api/sessionToken.ts'
import type { Language } from '../../shared/i18n/languages.ts'
import {
  requestCodeVerification,
  requestCurrentUser,
  requestProfileUpdate,
  requestRoles,
  requestSignInCode,
  requestTestAccounts,
} from './authApi.ts'
import type { RequestCodeResponse, Role, SessionUser, TestAccount } from './authTypes.ts'

// 'checking' means a token was found and the server has not yet confirmed it.
type SessionStatus = 'checking' | 'signedIn' | 'signedOut'

type AuthState = {
  sessionStatus: SessionStatus
  user: SessionUser | null
  roles: Role[]
  testAccounts: TestAccount[]
  // Set once a code was requested, which moves the sign-in screen on to entering the code.
  codeEmail: string | null
  testCode: string | null
  codeRequestStatus: RequestStatus
  verificationStatus: RequestStatus
  error: ApiError | null
  profileStatus: RequestStatus
  profileError: ApiError | null
  // Here and not in the profile panel, because the profile menu in the header opens it too.
  isEditingProfile: boolean
}

const initialState: AuthState = {
  sessionStatus: readSessionToken() ? 'checking' : 'signedOut',
  user: null,
  roles: [],
  testAccounts: [],
  codeEmail: null,
  testCode: null,
  codeRequestStatus: 'idle',
  verificationStatus: 'idle',
  error: null,
  profileStatus: 'idle',
  profileError: null,
  isEditingProfile: false,
}

export const fetchRoles = createAsyncThunk<Role[], void>('auth/fetchRoles', () => requestRoles())

// The list is optional, so a failure just leaves it out. It fails on purpose when switched off on the server.
export const fetchTestAccounts = createAsyncThunk<TestAccount[], void>('auth/fetchTestAccounts', () => requestTestAccounts())

export const requestCode = createAsyncThunk<
  RequestCodeResponse,
  { email: string; language: Language },
  { rejectValue: ApiError }
>('auth/requestCode', async ({ email, language }, { rejectWithValue }) => {
  try {
    return await requestSignInCode(email, language)
  } catch (error) {
    return rejectWithValue(getApiError(error))
  }
})

export const verifyCode = createAsyncThunk<SessionUser, { email: string; code: string }, { rejectValue: ApiError }>(
  'auth/verifyCode',
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const { token, user } = await requestCodeVerification(email, code)
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

export const saveProfile = createAsyncThunk<SessionUser, string, { rejectValue: ApiError }>(
  'auth/saveProfile',
  async (name, { rejectWithValue }) => {
    try {
      return await requestProfileUpdate(name)
    } catch (error) {
      return rejectWithValue(getApiError(error))
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    codeEntryLeft(state) {
      state.codeEmail = null
      state.testCode = null
      state.error = null
    },
    profileEditStarted(state) {
      state.profileStatus = 'idle'
      state.profileError = null
      state.isEditingProfile = true
    },
    profileEditCancelled(state) {
      state.profileStatus = 'idle'
      state.profileError = null
      state.isEditingProfile = false
    },
    signedOut(state) {
      state.sessionStatus = 'signedOut'
      state.user = null
      state.codeEmail = null
      state.testCode = null
      state.codeRequestStatus = 'idle'
      state.verificationStatus = 'idle'
      state.error = null
      state.profileStatus = 'idle'
      state.profileError = null
      state.isEditingProfile = false
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
      .addCase(requestCode.pending, (state) => {
        state.codeRequestStatus = 'loading'
        state.error = null
      })
      .addCase(requestCode.fulfilled, (state, action) => {
        state.codeRequestStatus = 'succeeded'
        state.codeEmail = action.meta.arg.email
        state.testCode = action.payload.testCode ?? null
      })
      .addCase(requestCode.rejected, (state, action) => {
        state.codeRequestStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(verifyCode.pending, (state) => {
        state.verificationStatus = 'loading'
        state.error = null
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.verificationStatus = 'succeeded'
        state.sessionStatus = 'signedIn'
        state.user = action.payload
        state.codeEmail = null
        state.testCode = null
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.verificationStatus = 'failed'
        state.error = action.payload ?? FALLBACK_API_ERROR
      })
      .addCase(saveProfile.pending, (state) => {
        state.profileStatus = 'loading'
        state.profileError = null
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded'
        state.user = action.payload
        state.isEditingProfile = false
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.profileStatus = 'failed'
        state.profileError = action.payload ?? FALLBACK_API_ERROR
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

export const { codeEntryLeft, profileEditCancelled, profileEditStarted, signedOut } = authSlice.actions
export const authReducer = authSlice.reducer

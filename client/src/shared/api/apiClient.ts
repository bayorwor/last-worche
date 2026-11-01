import axios from 'axios'
import { assertApiResponse } from './assertApiResponse.ts'
import { readSessionToken } from './sessionToken.ts'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

apiClient.interceptors.request.use((config) => {
  const token = readSessionToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use((response) => {
  assertApiResponse(response.headers['content-type'])
  return response
})

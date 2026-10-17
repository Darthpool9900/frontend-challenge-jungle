
import axios from 'axios'

export const AUTH_TOKEN_KEY = 'jungle.auth.token'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

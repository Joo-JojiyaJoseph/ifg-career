import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const client = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const data = error.response?.data ?? {}
    const normalized = Object.assign(error, {
      status,
      message: data.message || 'Something went wrong. Please try again.',
      errors: data.errors ?? null,
      code: data.code ?? null,
    })

    if (status === 401 && !error.config?.skipAuthRedirect && typeof window !== 'undefined') {
      const onPortal = window.location.port === '5174'
      const target = onPortal ? '/login' : '/'
      if (window.location.pathname !== target) {
        window.location.assign(target)
      }
    }

    return Promise.reject(normalized)
  },
)

export async function ensureCsrf() {
  await client.get('/sanctum/csrf-cookie')
}

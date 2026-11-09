import axios from 'axios'

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Local development only: browsers treat `localhost` and `127.0.0.1` as different sites, so a page on
 * localhost:5174 can't read the CSRF cookie of an API on 127.0.0.1:8000 ("CSRF token mismatch").
 * When both the page and the URL are loopback names, use the page's name. Real domains are unchanged.
 */
export function matchPageHost(url) {
  if (typeof window === 'undefined' || !url) return url
  try {
    const target = new URL(url)
    const page = window.location.hostname
    if (LOOPBACK.has(target.hostname) && LOOPBACK.has(page) && target.hostname !== page) {
      target.hostname = page
      return target.toString().replace(/\/$/, '')
    }
  } catch {
    // Not an absolute URL: leave it as it is.
  }
  return url
}

/** True when the Vite dev server forwards API calls (VITE_API_PROXY): requests then go to this page's own origin. */
export const proxied = Boolean(import.meta.env.DEV && import.meta.env.VITE_API_PROXY && typeof window !== 'undefined')

export const apiUrl = proxied ? window.location.origin : matchPageHost(import.meta.env.VITE_API_URL || 'http://localhost:8000')

/** An API address (such as VITE_GOOGLE_LOGIN_URL) adjusted for the dev proxy and loopback host names. */
export function apiAddress(url) {
  if (!url) return url
  if (proxied) {
    const target = new URL(url)
    return `${window.location.origin}${target.pathname}${target.search}`
  }
  return matchPageHost(url)
}

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

let unauthorizedRedirect = '/'

/** Where to send people when their session has expired: '/login' in the portal, '/' on the careers site. */
export function setUnauthorizedRedirect(path) {
  unauthorizedRedirect = path
}

function messageFor(status, data, error) {
  if (status === 419) {
    return import.meta.env.DEV
      ? 'Sign-in was blocked: the API\'s security cookie is not reaching this page. Open the browser console for the setting to fix.'
      : 'Your session expired. Refresh the page and try again.'
  }
  if (data.message && status !== 500) return data.message
  const firstFieldError = Object.values(data.errors ?? {}).flat()[0]
  if (firstFieldError) return firstFieldError
  if (!error.response) return error.code === 'ECONNABORTED' ? 'The server took too long to answer. Please try again.' : 'We could not reach the server. Check your connection and try again.'
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.'
  if (status === 413) return 'The files are larger than the server accepts (error 413). Choose smaller files, or raise post_max_size and upload_max_filesize in php.ini.'
  if (status === 404 || status === 405) return `The server did not recognise this request (error ${status}). If you just updated the app, clear its caches (php artisan optimize:clear) and try again.`
  if (status >= 500) return `Something went wrong on our side (error ${status}). Please try again in a moment.`
  return `Something went wrong (error ${status}). Please try again.`
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status

    // 419: the CSRF token is stale (expired session, re-seeded database, another tab signed out).
    // Fetch a fresh one and retry the request once.
    if (status === 419 && error.config && !error.config.csrfRetried) {
      try {
        await ensureCsrf()
        return await client.request({ ...error.config, csrfRetried: true })
      } catch (retryError) {
        error = retryError
      }
    }

    return Promise.reject(normalize(error))
  },
)

/** Adds a readable message, field errors and the API's error code to an Axios error. */
/**
 * The error body as an object. When PHP prints a warning before the JSON (display_errors on), axios hands over a
 * string; the JSON part is still in there, so read it out rather than losing the message and field errors.
 */
export function bodyOf(raw) {
  if (raw && typeof raw === 'object') return raw
  if (typeof raw !== 'string') return {}
  const start = raw.indexOf('{"')
  if (start === -1) return {}
  try {
    return JSON.parse(raw.slice(start))
  } catch {
    return {}
  }
}

function normalize(error) {
  const status = error.response?.status
  const data = bodyOf(error.response?.data)
  const normalized = Object.assign(error, {
    status,
    message: messageFor(status, data, error),
    errors: data.errors ?? null,
    code: data.code ?? null,
  })

  if (status === 401 && !error.config?.skipAuthRedirect && typeof window !== 'undefined') {
    if (window.location.pathname !== unauthorizedRedirect) {
      window.location.assign(unauthorizedRedirect)
    }
  }

  return normalized
}

function readCookie(name) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : null
}

export async function ensureCsrf() {
  const before = readCookie('XSRF-TOKEN')
  await client.get('/sanctum/csrf-cookie')
  const after = readCookie('XSRF-TOKEN')

  // Development help: Laravel sends a new XSRF-TOKEN cookie on every call. If this page can't see it
  // (or still sees the old one), the browser rejected it, and every form post will fail with 419.
  if (import.meta.env.DEV && (!after || after === before)) {
    const apiHost = new URL(apiUrl).hostname
    const pageHost = window.location.hostname
    const sameName = apiHost === pageHost || (LOOPBACK.has(apiHost) && LOOPBACK.has(pageHost))
    console.warn(
      sameName
        ? `[CSRF] The API at ${apiUrl} set a cookie this page (${window.location.origin}) can't use, so sign-in will fail with "CSRF token mismatch".\n` +
            'Fix it in career-backend/.env, then run "php artisan optimize:clear" and restart the API:\n' +
            '  SESSION_DOMAIN=null\n' +
            '  SESSION_SECURE_COOKIE=false\n' +
            '  SESSION_SAME_SITE=lax\n' +
            '  SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,localhost:5174,127.0.0.1,127.0.0.1:5173,127.0.0.1:5174\n' +
            'In DevTools > Network, the csrf-cookie response shows a yellow warning on any cookie the browser blocked, with the reason.'
        : `[CSRF] This page runs on "${pageHost}" but the API is on "${apiHost}". Browsers treat them as different sites and won't share the sign-in cookies.\n` +
            'Pick one, then restart "npm run dev":\n' +
            `  A) Proxy through Vite (keeps ${apiHost}): in this app's .env set VITE_API_PROXY=${new URL(apiUrl).origin}\n` +
            '  B) Use "php artisan serve" and set VITE_API_URL=http://localhost:8000',
    )
  }
}

import { apiAddress, client, ensureCsrf } from '@shared/api/createClient'

export async function fetchMe() {
  const { data } = await client.get('/api/v1/candidate/me', { skipAuthRedirect: true })
  return data.data
}

export async function logout() {
  await ensureCsrf()
  await client.post('/api/v1/candidate/logout')
}

let leaving = false

/**
 * Sends the browser to Google sign-in. A second click while the page is already leaving is ignored: starting twice
 * would replace the first sign-in's security code. Coming back with the browser's Back button allows it again.
 */
export function startGoogleSignIn(returnPath) {
  if (leaving) return
  leaving = true
  window.addEventListener('pageshow', () => { leaving = false }, { once: true })
  const url = new URL(apiAddress(import.meta.env.VITE_GOOGLE_LOGIN_URL || 'http://localhost:8000/api/v1/auth/google/redirect'))
  if (returnPath) url.searchParams.set('return', returnPath)
  window.location.assign(url.toString())
}

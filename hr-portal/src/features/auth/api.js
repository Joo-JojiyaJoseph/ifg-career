import { client, ensureCsrf } from '@shared/api/createClient'

export const SESSION_NOT_KEPT =
  'You signed in, but your browser did not keep the sign-in, so the next page would sign you out again. ' +
  "This is a server setting, not your password. On the server, run \"php artisan app:check-login\" in the API folder and fix what it lists."

/**
 * Checks that the session from a successful sign-in really works on the next request. When the cookie settings on
 * the server are wrong (SESSION_DOMAIN, SANCTUM_STATEFUL_DOMAINS, https), the browser drops the cookie and the
 * portal would bounce straight back to this page with no explanation. This turns that into a clear message.
 */
async function confirmSession(result) {
  if (result?.status !== 'authenticated') return result
  try {
    await client.get('/api/v1/hr/me', { skipAuthRedirect: true })
  } catch (error) {
    if (error.status === 401) throw Object.assign(new Error(SESSION_NOT_KEPT), { status: 401, code: 'session_not_kept' })
    throw error
  }
  return result
}

export async function login(payload) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/login', payload)
  return confirmSession(data)
}

export async function beginTwoFactorSetup() {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/two-factor/setup')
  return data.data
}

export async function confirmTwoFactor(code) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/two-factor/confirm', { code })
  return confirmSession(data)
}

export async function challengeTwoFactor(code) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/two-factor/challenge', { code })
  return confirmSession(data)
}

export async function logout() {
  await ensureCsrf()
  await client.post('/api/v1/hr/logout')
}

export async function fetchMe() {
  const { data } = await client.get('/api/v1/hr/me', { skipAuthRedirect: true })
  return data.data
}

export async function forgotPassword(email) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/forgot-password', { email })
  return data
}

export async function resetPassword(payload) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/reset-password', payload)
  return data
}

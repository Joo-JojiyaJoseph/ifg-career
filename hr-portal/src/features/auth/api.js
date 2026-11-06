import { client, ensureCsrf } from '@shared/api/createClient'

export async function login(payload) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/login', payload)
  return data
}

export async function beginTwoFactorSetup() {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/two-factor/setup')
  return data.data
}

export async function confirmTwoFactor(code) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/two-factor/confirm', { code })
  return data
}

export async function challengeTwoFactor(code) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/two-factor/challenge', { code })
  return data
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

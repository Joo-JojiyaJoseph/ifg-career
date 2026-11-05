import { client, ensureCsrf } from '@shared/api/createClient'

export async function fetchMe() {
  const { data } = await client.get('/api/v1/candidate/me', { skipAuthRedirect: true })
  return data.data
}

export async function logout() {
  await ensureCsrf()
  await client.post('/api/v1/candidate/logout')
}

export function startGoogleSignIn(returnPath) {
  const url = new URL(import.meta.env.VITE_GOOGLE_LOGIN_URL || 'http://localhost:8000/api/v1/auth/google/redirect')
  if (returnPath) url.searchParams.set('return', returnPath)
  window.location.assign(url.toString())
}

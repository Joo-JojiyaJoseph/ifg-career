import { client, ensureCsrf } from '@shared/api/createClient'
import { compact } from '@shared/api/params'

export async function fetchUnread() {
  // Marked as background so polling never keeps an idle session alive.
  const { data } = await client.get('/api/v1/hr/notifications/unread-count', { headers: { 'X-Background-Request': '1' } })
  return data.data
}

export async function fetchNotifications(params) {
  const { data } = await client.get('/api/v1/hr/notifications', { params: compact(params) })
  return data
}

export async function markRead(id) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/notifications/${id}/read`)
  return data.data
}

export async function markAllRead() {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/notifications/read-all')
  return data.data
}

export async function fetchPreferences() {
  const { data } = await client.get('/api/v1/hr/notification-preferences')
  return data.data
}

export async function savePreferences(preferences) {
  await ensureCsrf()
  const { data } = await client.put('/api/v1/hr/notification-preferences', { preferences })
  return data.data
}

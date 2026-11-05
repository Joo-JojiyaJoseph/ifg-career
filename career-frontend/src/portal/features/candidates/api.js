import { client, ensureCsrf } from '@shared/api/createClient'

export async function fetchCandidates(params) {
  const { data } = await client.get('/api/v1/hr/candidates', { params: compact(params) })
  return data
}

export async function fetchCandidate(publicId) {
  const { data } = await client.get(`/api/v1/hr/candidates/${publicId}`)
  return data.data
}

export async function fetchActivity(publicId) {
  const { data } = await client.get(`/api/v1/hr/candidates/${publicId}/activity`)
  return data.data
}

export async function fetchResume(publicId) {
  const { data } = await client.get(`/api/v1/hr/candidates/${publicId}/resume`)
  return data.data
}

export async function updateColour(publicId, colourTag) {
  await ensureCsrf()
  const { data } = await client.patch(`/api/v1/hr/candidates/${publicId}`, { colour_tag: colourTag })
  return data.data
}

export async function addNote(publicId, body) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/candidates/${publicId}/notes`, { body })
  return data.data
}

export async function blacklistCandidate(publicId, reason) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/candidates/${publicId}/blacklist`, { reason })
  return data.data
}

export async function removeBlacklist(publicId, reason) {
  await ensureCsrf()
  const { data } = await client.delete(`/api/v1/hr/candidates/${publicId}/blacklist`, { data: { reason } })
  return data.data
}

export async function overrideBlock(publicId, roleKey, reason) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/candidates/${publicId}/role-blocks/${encodeURIComponent(roleKey)}/override`, { reason })
  return data.data
}

export async function fetchHrMeta() {
  const { data } = await client.get('/api/v1/hr/meta')
  return data.data
}

export async function fetchEntities() {
  const { data } = await client.get('/api/v1/public/entities')
  return data.data
}

export async function fetchSavedFilters() {
  const { data } = await client.get('/api/v1/hr/saved-filters', { params: { screen: 'candidates' } })
  return data.data
}

export async function saveFilter(payload) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/saved-filters', { screen: 'candidates', ...payload })
  return data.data
}

export async function deleteFilter(id) {
  await ensureCsrf()
  await client.delete(`/api/v1/hr/saved-filters/${id}`)
}

function compact(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

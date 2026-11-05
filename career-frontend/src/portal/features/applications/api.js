import { client, ensureCsrf } from '@shared/api/createClient'

export async function fetchApplications(params) {
  const { data } = await client.get('/api/v1/hr/applications', { params: compact(params) })
  return data
}

export async function updateStatus(publicId, status) {
  await ensureCsrf()
  const { data } = await client.patch(`/api/v1/hr/applications/${publicId}/status`, { status })
  return data.data
}

export async function bulkStatus(ids, status) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/applications/bulk-status', { ids, status })
  return data.data
}

export async function undoStatus(publicId) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/applications/${publicId}/undo-status`)
  return data.data
}

export async function assignJob(publicId, job) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/applications/${publicId}/assign-job`, { job })
  return data.data
}

export async function fetchOpenJobs() {
  const { data } = await client.get('/api/v1/hr/job-postings', { params: { status: 'published', per_page: 100 } })
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
  const { data } = await client.get('/api/v1/hr/saved-filters', { params: { screen: 'applications' } })
  return data.data
}

export async function saveFilter(payload) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/saved-filters', { screen: 'applications', ...payload })
  return data.data
}

export async function deleteFilter(id) {
  await ensureCsrf()
  await client.delete(`/api/v1/hr/saved-filters/${id}`)
}

function compact(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

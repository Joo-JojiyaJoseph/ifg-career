import { client, ensureCsrf } from '@shared/api/createClient'

export async function fetchJobs(params) {
  const { data } = await client.get('/api/v1/hr/job-postings', { params: compact(params) })
  return data
}

export async function fetchJob(publicId) {
  const { data } = await client.get(`/api/v1/hr/job-postings/${publicId}`)
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
  const { data } = await client.get('/api/v1/hr/saved-filters', { params: { screen: 'jobs' } })
  return data.data
}

export async function createJob(payload) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/job-postings', payload)
  return data.data
}

export async function updateJob(publicId, payload) {
  await ensureCsrf()
  const { data } = await client.patch(`/api/v1/hr/job-postings/${publicId}`, payload)
  return data.data
}

export async function jobAction(publicId, action, payload) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/job-postings/${publicId}/${action}`, payload)
  return data.data
}

export async function deleteJob(publicId) {
  await ensureCsrf()
  await client.delete(`/api/v1/hr/job-postings/${publicId}`)
}

export async function bulkJobs(action, ids) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/job-postings/bulk', { action, ids })
  return data.data
}

export async function saveFilter(payload) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/saved-filters', { screen: 'jobs', ...payload })
  return data.data
}

export async function deleteFilter(id) {
  await ensureCsrf()
  await client.delete(`/api/v1/hr/saved-filters/${id}`)
}

function compact(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

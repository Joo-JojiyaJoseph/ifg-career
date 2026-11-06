import { client, ensureCsrf } from '@shared/api/createClient'
import { compact } from '@shared/api/params'

export async function fetchMembers(params) {
  const { data } = await client.get('/api/v1/hr/talent-members', { params: compact(params) })
  return data
}

export async function fetchCampaigns(params) {
  const { data } = await client.get('/api/v1/hr/campaigns', { params: compact(params) })
  return data
}

export async function fetchCampaign(id) {
  const { data } = await client.get(`/api/v1/hr/campaigns/${id}`)
  return data.data
}

export async function previewCampaign(payload) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/campaigns/preview', payload)
  return data.data
}

export async function saveCampaign(payload, id) {
  await ensureCsrf()
  const { data } = id ? await client.patch(`/api/v1/hr/campaigns/${id}`, payload) : await client.post('/api/v1/hr/campaigns', payload)
  return data.data
}

export async function sendCampaign(id) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/campaigns/${id}/send`)
  return data.data
}

export async function fetchPublishedJobs() {
  const { data } = await client.get('/api/v1/hr/job-postings', { params: { status: 'published', per_page: 100 } })
  return data.data
}

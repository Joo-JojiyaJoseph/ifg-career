import { client, ensureCsrf } from '@shared/api/createClient'
import { compact } from '@shared/api/params'

export async function fetchRounds(params) {
  const { data } = await client.get('/api/v1/hr/interviews', { params: compact(params) })
  return data
}

export async function fetchCalendar(params) {
  const { data } = await client.get('/api/v1/hr/interviews', { params: compact({ ...params, view: 'calendar' }) })
  return data.data
}

export async function fetchPipeline(params) {
  const { data } = await client.get('/api/v1/hr/interviews/pipeline', { params: compact(params) })
  return data
}

export async function scheduleRound(applicationId, payload) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/applications/${applicationId}/rounds`, payload)
  return data
}

export async function updateRound(roundId, payload) {
  await ensureCsrf()
  const { data } = await client.patch(`/api/v1/hr/rounds/${roundId}`, payload)
  return data
}

export async function cancelRound(roundId) {
  await ensureCsrf()
  await client.delete(`/api/v1/hr/rounds/${roundId}`)
}

export async function updateRoundStatus(roundId, status, feedback) {
  await ensureCsrf()
  const { data } = await client.patch(`/api/v1/hr/rounds/${roundId}/status`, { status, feedback })
  return data.data
}

export async function retrySync(roundId) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/rounds/${roundId}/retry-sync`)
  return data.data
}

export async function setResult(applicationId, result) {
  await ensureCsrf()
  const { data } = await client.patch(`/api/v1/hr/applications/${applicationId}/result`, { result })
  return data.data
}

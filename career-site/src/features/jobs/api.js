import { client } from '@shared/api/createClient'

export async function fetchPublicJobs(params) {
  const { data } = await client.get('/api/v1/public/jobs', { params: compact(params) })
  return data
}

/** Total open roles and per-entity counts, shared by the hero and the entity cards. */
export const heroJobsQuery = { queryKey: ['public-jobs', 'overview'], queryFn: () => fetchPublicJobs({ per_page: 1 }), staleTime: 300_000 }

export async function fetchPublicJob(publicId, previewUrl) {
  const response = previewUrl ? await client.get(previewUrl) : await client.get(`/api/v1/public/jobs/${publicId}`)
  return response.data.data
}

export async function fetchPublicMeta() {
  const { data } = await client.get('/api/v1/public/meta')
  return data.data
}

export async function fetchEntities() {
  const { data } = await client.get('/api/v1/public/entities')
  return data.data
}

export function publicIdFromParam(value) {
  if (!value) return null
  const index = value.lastIndexOf('-')
  const id = index === -1 ? value : value.slice(index + 1)
  return id.length === 26 ? id : null
}

function compact(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== false))
}

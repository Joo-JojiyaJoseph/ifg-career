import { client, ensureCsrf } from '@shared/api/createClient'

export async function queueExport(type, filters) {
  await ensureCsrf()
  const { data } = await client.post('/api/v1/hr/exports', { type, filters })
  return data.data
}

export async function fetchExport(id) {
  const { data } = await client.get(`/api/v1/hr/exports/${id}`)
  return data.data
}

export async function downloadExport(id, filename) {
  const response = await client.get(`/api/v1/hr/exports/${id}/download`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

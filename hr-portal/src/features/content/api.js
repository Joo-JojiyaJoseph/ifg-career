import { client, ensureCsrf } from '@shared/api/createClient'

function toBody(values) {
  const body = new FormData()
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined) return
    if (value instanceof File) body.append(key, value)
    else if (typeof value === 'boolean') body.append(key, value ? '1' : '0')
    else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') Object.entries(item).forEach(([field, inner]) => body.append(`${key}[${index}][${field}]`, inner ?? ''))
        else body.append(`${key}[]`, item)
      })
    } else body.append(key, value ?? '')
  })
  return body
}

export async function fetchItems(type) {
  const { data } = await client.get(`/api/v1/hr/content/${type}`)
  return data.data
}

export async function saveItem(type, values, id) {
  await ensureCsrf()
  const { data } = await client.post(id ? `/api/v1/hr/content/${type}/${id}` : `/api/v1/hr/content/${type}`, toBody(values))
  return data.data
}

export async function deleteItem(type, id) {
  await ensureCsrf()
  await client.delete(`/api/v1/hr/content/${type}/${id}`)
}

export async function reorderItems(type, ids) {
  await ensureCsrf()
  await client.post(`/api/v1/hr/content/${type}/reorder`, { ids })
}

export async function fetchSettings() {
  const { data } = await client.get('/api/v1/hr/content/settings')
  return data.data
}

export async function saveSetting(key, values) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/content/settings/${key}`, toBody(values))
  return data.data
}

export async function fetchEntityContent() {
  const { data } = await client.get('/api/v1/hr/content/entities')
  return data.data
}

export async function saveEntity(slug, values) {
  await ensureCsrf()
  const { data } = await client.post(`/api/v1/hr/content/entities/${slug}`, toBody(values))
  return data.data
}

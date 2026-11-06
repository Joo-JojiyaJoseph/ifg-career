import { client, ensureCsrf } from '@shared/api/createClient'
import { compact } from '@shared/api/params'

const send = (method) => async (url, body) => {
  await ensureCsrf()
  return (await client[method](url, body)).data
}
const post = send('post')
const patch = send('patch')
const put = send('put')

export const fetchUsers = async (params) => (await client.get('/api/v1/hr/users', { params: compact(params) })).data
export const inviteUser = (body) => post('/api/v1/hr/users', body)
export const updateUser = (id, body) => patch(`/api/v1/hr/users/${id}`, body)
export const toggleUser = (id, isActive) => post(`/api/v1/hr/users/${id}/toggle-active`, { is_active: isActive })
export const resetTwoFactor = (id) => post(`/api/v1/hr/users/${id}/reset-2fa`)
export const resendInvite = (id) => post(`/api/v1/hr/users/${id}/resend-invite`)
export const fetchMatrix = async () => (await client.get('/api/v1/hr/roles-permissions')).data.data
export const saveMatrix = (roles) => put('/api/v1/hr/roles-permissions', { roles })
export const fetchList = async (type) => (await client.get(`/api/v1/hr/lists/${type}`)).data.data
export const createListItem = (type, body) => post(`/api/v1/hr/lists/${type}`, body)
export const updateListItem = (type, id, body) => patch(`/api/v1/hr/lists/${type}/${id}`, body)
export const deleteListItem = async (type, id) => {
  await ensureCsrf()
  await client.delete(`/api/v1/hr/lists/${type}/${id}`)
}
export const fetchHealth = async () => (await client.get('/api/v1/hr/system/health')).data.data
export const testIntegration = (key) => post(`/api/v1/hr/system/test/${key}`)
export const retryJob = (uuid) => post(`/api/v1/hr/system/failed-jobs/${uuid}/retry`)

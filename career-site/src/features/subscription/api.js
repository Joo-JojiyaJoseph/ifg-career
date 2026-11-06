import { client } from '@shared/api/createClient'

export async function fetchSubscription(token) {
  const { data } = await client.get(`/api/v1/public/unsubscribe/${token}`, { skipAuthRedirect: true })
  return data.data
}

export async function unsubscribe(token) {
  const { data } = await client.post(`/api/v1/public/unsubscribe/${token}`, null, { skipAuthRedirect: true })
  return data
}

export async function resubscribe(token) {
  const { data } = await client.post(`/api/v1/public/resubscribe/${token}`, null, { skipAuthRedirect: true })
  return data
}

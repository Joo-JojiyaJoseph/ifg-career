import { client } from '@shared/api/createClient'
import { compact } from '@shared/api/params'

const get = (path) => async (params) => (await client.get(`/api/v1/hr/dashboard/${path}`, { params: compact(params) })).data.data

export const fetchStats = get('stats')
export const fetchActionItems = get('action-items')
export const fetchPipeline = get('pipeline')
export const fetchOverTime = get('applications-over-time')
export const fetchSources = get('sources')
export const fetchUpcoming = get('upcoming-interviews')
export const fetchRecent = get('recent-candidates')
export const fetchPromo = get('promo')

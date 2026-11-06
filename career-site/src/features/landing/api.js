import { client } from '@shared/api/createClient'

export async function fetchContent() {
  const { data } = await client.get('/api/v1/public/content')
  return data.data
}

export const contentQuery = { queryKey: ['public-content'], queryFn: fetchContent, staleTime: 600_000 }

/** Seeded placeholder images are replaced by the orbit graphic until HR uploads a real photo. */
export function isPlaceholder(url) {
  return !url || url.startsWith('/images/placeholders/hero')
}

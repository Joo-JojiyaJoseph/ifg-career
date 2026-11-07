import { client } from '@shared/api/createClient'

export async function fetchContent() {
  const { data } = await client.get('/api/v1/public/content')
  return data.data
}

export const contentQuery = { queryKey: ['public-content'], queryFn: fetchContent, staleTime: 600_000 }

/** The old seeded SVG placeholders are skipped; the section shows its brand gradient until HR uploads a photo. */
export function isPlaceholder(url) {
  return !url || url.startsWith('/images/placeholders/')
}

/** Culture photos (HR's "activity" media items) shown in the hero, the belonging section and the footer. */
export function culturePhotos(content) {
  return (content?.media ?? []).filter((item) => item.type === 'activity' && item.photo_url && !isPlaceholder(item.photo_url))
}

/**
 * Official logo files dropped into this folder (see README.md).
 * Vite bundles whatever is here at build time, so a missing file simply means "use the monogram".
 */
const files = import.meta.glob('./*.{svg,png,webp}', { eager: true, query: '?url', import: 'default' })

const byName = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace('./', '').replace(/\.(svg|png|webp)$/, ''), url]),
)

/**
 * Official logos linked from the group's own websites, used when no file is bundled here.
 * Webfolks and Medrays have no link yet: add one here, drop a file in this folder, or upload a logo in Website Content.
 */
const officialLinks = {
  'infolks-group': 'https://infolksgroup.com/images/logo/logo.svg',
  'infolks-group-white': 'https://infolksgroup.com/images/logo/logo-white.svg',
  infolks: 'https://infolks.info/images/home/logo_new.svg',
  dataways: 'https://dataways.ai/images/logo/logo.svg',
}

/** URL of a brand logo such as `infolks-group` or `dataways-white`: the bundled file, else the official link, else null. */
export function brandAsset(name) {
  return byName[name] ?? officialLinks[name] ?? null
}

export const GROUP = {
  name: 'Infolks Group',
  tagline: 'A company with a heart',
  website: 'https://infolksgroup.com',
}

const placeholder = (url) => !url || url.includes('/placeholders/')

/** Where an entity's logo comes from: HR's upload first, then the bundled official file. */
export function entityLogoUrl(entity, tone = 'light') {
  if (!entity) return null
  const uploaded = entity.theme?.logo_url
  if (!placeholder(uploaded)) return uploaded
  if (tone === 'dark') return brandAsset(`${entity.slug}-white`) ?? brandAsset(entity.slug)
  return brandAsset(entity.slug)
}

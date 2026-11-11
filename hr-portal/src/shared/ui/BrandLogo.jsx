import { useState } from 'react'
import PropTypes from 'prop-types'
import { BriefcaseIcon } from '@heroicons/react/24/outline'
import { GROUP, brandAsset, entityLogoUrl } from '../brand'

const tiles = {
  sm: 'h-9 w-9 rounded-xl text-xs',
  md: 'h-12 w-12 rounded-2xl text-sm',
  lg: 'h-14 w-14 rounded-2xl text-base',
  xl: 'h-20 w-20 rounded-3xl text-xl',
}

// The logo fills the tile (less a little padding), so wide wordmarks stay as large and readable as possible.
const images = { sm: 'p-1', md: 'p-1.5', lg: 'p-2', xl: 'p-2.5' }
const icons = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6', xl: 'h-8 w-8' }

/**
 * Infolks Group logo. Uses the official file from `src/shared/brand` when it exists,
 * otherwise a monogram tile plus the name. `tone="dark"` for dark backgrounds.
 */
export function GroupLogo({ tone = 'light', size = 'md', suffix, className = '' }) {
  const dark = tone === 'dark'
  const wanted = dark ? brandAsset('infolks-group-white') ?? brandAsset('infolks-group') : brandAsset('infolks-group')
  // A linked logo that fails to load (offline, blocked) falls back to the monogram.
  const [failed, setFailed] = useState(null)
  const file = wanted && failed !== wanted ? wanted : null
  const onTile = dark && file && !brandAsset('infolks-group-white')

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {file ? (
        <span className={onTile ? 'rounded-xl bg-white px-2.5 py-1.5' : ''}>
          <img src={file} alt={GROUP.name} className={`${size === 'lg' ? 'h-12 max-w-[14rem]' : 'h-8 max-w-[10rem]'} w-auto object-contain`} width="140" height="32" onError={() => setFailed(file)} />
        </span>
      ) : (
        <>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900 font-display text-sm font-semibold text-white shadow-glow" aria-hidden="true">IG</span>
          <span className={`whitespace-nowrap font-display text-lg font-semibold leading-none ${dark ? 'text-white' : 'text-ink'}`}>{GROUP.name}</span>
        </>
      )}
      {suffix ? (
        <span className={`hidden whitespace-nowrap border-l pl-3 font-display text-base font-medium leading-none sm:inline ${dark ? 'border-white/20 text-white/70' : 'border-border text-brand-700'}`}>{suffix}</span>
      ) : null}
    </span>
  )
}

GroupLogo.propTypes = { tone: PropTypes.oneOf(['light', 'dark']), size: PropTypes.oneOf(['md', 'lg']), suffix: PropTypes.string, className: PropTypes.string }

/**
 * An entity's logo on a white tile edged with its colour, or its monogram when no logo exists yet or the logo
 * cannot be loaded. Without an entity (a general application to the group) it shows a briefcase.
 * Decorative by default (the entity name is usually printed next to it); pass `labelled` when it stands alone.
 */
export function EntityLogo({ entity, size = 'md', labelled = false, className = '' }) {
  const wanted = entityLogoUrl(entity)
  const [failed, setFailed] = useState(null)
  const url = wanted && failed !== wanted ? wanted : null
  const primary = entity?.theme?.primary ?? '#1976D2'

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden ring-1 ${url ? 'bg-white' : 'bg-[color-mix(in_srgb,var(--logo-tint)_10%,white)]'} ring-[color-mix(in_srgb,var(--logo-tint)_22%,white)] ${tiles[size]} ${className}`}
      style={{ '--logo-tint': primary }}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? `${entity?.name ?? 'Infolks Group'} logo` : undefined}
      aria-hidden={labelled ? undefined : 'true'}
    >
      {url ? (
        <img src={url} alt="" className={`h-full w-full object-contain ${images[size]}`} loading="lazy" onError={() => setFailed(url)} />
      ) : !entity ? (
        <BriefcaseIcon className={`${icons[size]} text-[var(--logo-tint)]`} />
      ) : (
        <span className="font-display font-semibold text-[var(--logo-tint)]">{entity?.name?.slice(0, 2)}</span>
      )}
    </span>
  )
}

EntityLogo.propTypes = {
  entity: PropTypes.shape({ name: PropTypes.string, slug: PropTypes.string, theme: PropTypes.object }),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  labelled: PropTypes.bool,
  className: PropTypes.string,
}

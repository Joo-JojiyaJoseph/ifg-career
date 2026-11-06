import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { EntityArt } from '@shared/ui/illustrations/EntityArt'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'

const offsets = ['', 'lg:mt-10', '', 'lg:mt-10']
const floats = ['', '[animation-delay:-2s]', '[animation-delay:-4s]', '[animation-delay:-6s]']

/**
 * Hero visual: four glass frames, one per entity, each picturing that company's real work.
 * Each frame links to the entity's open roles. Frames drift gently; still under reduced motion.
 */
export function EntityCollage({ entities }) {
  const reduced = usePrefersReducedMotion()

  return (
    <ul className="grid grid-cols-2 items-start gap-4" aria-label="Our companies">
      {entities.slice(0, 4).map((entity, index) => (
        <m.li
          key={entity.slug}
          className={offsets[index]}
          {...(reduced ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: 0.35 + index * 0.12, ease: [0.22, 1, 0.36, 1] } })}
        >
          <Link
            to={`/jobs?entity=${entity.slug}`}
            viewTransition
            className={`glass-dark group block rounded-[1.6rem] border p-2 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.14] focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-safe:animate-float-slow ${floats[index]}`}
            aria-label={`${entity.name}: ${entity.motto ?? 'view roles'}`}
          >
            <EntityArt entity={entity} index={index} className="block h-auto w-full rounded-[1.2rem] bg-white/95" />
            <span className="flex items-center gap-2 px-1.5 pb-1 pt-2.5">
              <EntityLogo entity={entity} size="sm" className="!h-7 !w-7 !rounded-lg !bg-white !text-[0.6rem]" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-white">{entity.name}</span>
                {entity.motto ? <span className="block truncate text-[0.7rem] text-white/60">{entity.motto}</span> : null}
              </span>
            </span>
          </Link>
        </m.li>
      ))}
    </ul>
  )
}

EntityCollage.propTypes = { entities: PropTypes.array.isRequired }

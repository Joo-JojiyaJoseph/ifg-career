import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/24/solid'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { AnimatedNumber } from '@shared/ui/Motion'
import { Photo } from '@shared/ui/Photo'
import { WordReveal } from '@shared/ui/WordReveal'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'
import { heroJobsQuery } from '../jobs/api'
import { isPlaceholder } from './api'

const numberLabels = {
  employees: 'people across the group',
  years: 'years of growing together',
  clients: 'clients served',
}

/**
 * Section 1 of the career page: "Be part of our heart · Infolks Group · A company with a heart".
 * A full-bleed photo slowly zooms behind smoked-glass panels: the job search, two culture photos and the numbers strip.
 * The site header floats over this section (see PublicLayout).
 */
export function HeroSection({ hero, numbers, entities, photos = [] }) {
  const reduced = usePrefersReducedMotion()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const enter = (delay, y = 18) => (reduced ? {} : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } })
  const background = isPlaceholder(hero?.banner_image) ? null : hero.banner_image
  const jobs = useQuery(heroJobsQuery)
  const openRoles = jobs.data?.meta?.total ?? 0
  const perEntity = jobs.data?.counts?.entity ?? {}
  const stats = [
    ...(openRoles ? [['roles', openRoles, 'open roles right now']] : []),
    ...Object.entries(numbers ?? {}).filter(([, value]) => Number(value) > 0).map(([key, value]) => [key, value, numberLabels[key] ?? key]),
    ...(entities.length ? [['companies', entities.length, 'companies, one heart']] : []),
  ].slice(0, 4)
  const side = photos.slice(0, 2)

  function search(event) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/jobs?q=${encodeURIComponent(q)}` : '/jobs', { viewTransition: true })
  }

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-white" aria-labelledby="hero-title">
      <Photo src={background} alt="" priority className="!absolute inset-0 -z-20" imgClassName="motion-safe:animate-ken-burns" />
      {/* Shade the photo so white text stays readable on any picture HR uploads. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/30" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-end gap-10 px-4 pb-10 pt-28 sm:pt-32 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:pb-14 2xl:max-w-7xl">
        <div className="min-w-0">
          {hero?.eyebrow ? (
            <m.p {...enter(0)} className="glass-dark inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 sm:text-sm">
              <HeartIcon className="h-4 w-4 text-rose-400 motion-safe:animate-heartbeat" aria-hidden="true" />
              {hero.eyebrow}
            </m.p>
          ) : null}
          <WordReveal
            text={hero?.title ?? 'Infolks Group'}
            delay={0.15}
            className="mt-5 font-display text-[clamp(3rem,8.5vw+0.5rem,7.5rem)] font-semibold uppercase leading-[0.92] tracking-tightest"
          />
          <m.p {...enter(0.5)} className="mt-5 font-display text-[clamp(1.35rem,2.4vw+0.6rem,2.4rem)] font-medium uppercase leading-tight tracking-wide">
            <span className="bg-gradient-to-r from-cyan-200 via-white to-amber-200 bg-clip-text text-transparent">{hero?.motto ?? 'A company with a heart'}</span>
          </m.p>
          {hero?.company_line ? <m.p {...enter(0.6)} className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">{hero.company_line}</m.p> : null}

          <m.form {...enter(0.7)} onSubmit={search} role="search" className="glass-dark mt-8 flex max-w-xl items-center gap-2 rounded-full p-1.5 pl-4 focus-within:border-cyan/60 focus-within:ring-4 focus-within:ring-cyan/15">
            <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
            <label htmlFor="hero-search" className="sr-only">Search roles</label>
            <input
              id="hero-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Role, skill or company"
              className="min-h-11 min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-white placeholder:text-white/55 focus:outline-none focus:ring-0"
            />
            <button type="submit" className="shine inline-flex min-h-11 shrink-0 items-center rounded-full bg-gradient-to-r from-accent-orange to-[#F7B04B] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(243,146,35,0.7)] transition duration-200 hover:-translate-y-0.5 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-6 sm:text-base">
              Job Search
            </button>
          </m.form>

          {entities.length ? (
            <m.ul {...enter(0.8)} className="mt-5 flex flex-wrap gap-2" aria-label="Roles by company">
              {entities.map((entity) => (
                <li key={entity.slug}>
                  <Link
                    to={`/jobs?entity=${entity.slug}`}
                    viewTransition
                    className="glass-dark inline-flex min-h-11 items-center gap-2 rounded-full py-1 pl-1 pr-4 text-sm font-medium text-white/90 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.16] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={`${entity.name} roles${perEntity[entity.slug] ? `, ${perEntity[entity.slug]} open` : ''}`}
                  >
                    <EntityLogo entity={entity} size="sm" className="!h-8 !w-8 !rounded-full !bg-white !text-[0.625rem]" />
                    {entity.name}
                  </Link>
                </li>
              ))}
            </m.ul>
          ) : null}
        </div>

        {side.length ? (
          <div className="relative hidden h-[30rem] lg:block" aria-hidden="true">
            {side.map((photo, index) => (
              <m.figure
                key={photo.id}
                {...(reduced ? {} : { initial: { opacity: 0, y: 40, rotate: index ? 4 : -4 }, animate: { opacity: 1, y: 0, rotate: index ? 3 : -3 }, transition: { duration: 0.9, delay: 0.5 + index * 0.15, ease: [0.22, 1, 0.36, 1] } })}
                className={`glass-dark absolute w-[16rem] rounded-[1.75rem] p-2 xl:w-[17rem] ${index ? 'bottom-0 right-0 z-10' : 'left-0 top-0'}`}
              >
                <div className={`motion-safe:animate-float-slow ${index ? '[animation-delay:-8s]' : ''}`}>
                  <Photo src={photo.photo_url} className="aspect-[4/3] rounded-[1.35rem]" sizes="272px" />
                  <figcaption className="px-2 pb-1 pt-3 text-sm font-medium text-white/90">{photo.title}</figcaption>
                </div>
              </m.figure>
            ))}
          </div>
        ) : null}
      </div>

      {stats.length ? (
        <m.div {...enter(0.9, 24)} className="mx-auto w-full max-w-6xl px-4 pb-8 2xl:max-w-7xl">
          <dl className="glass-dark grid grid-cols-2 gap-px overflow-hidden rounded-3xl sm:grid-cols-4">
            {stats.map(([key, value, label]) => (
              <div key={key} className="flex flex-col px-5 py-4 sm:px-6">
                <dt className="order-2 text-xs text-white/65 sm:text-sm">{label}</dt>
                <dd className="order-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  <AnimatedNumber value={Number(value)} />{['employees', 'clients'].includes(key) ? '+' : ''}
                </dd>
              </div>
            ))}
          </dl>
        </m.div>
      ) : null}

      <a href="#entities" className="mx-auto mb-4 hidden min-h-11 flex-col items-center gap-1 text-xs font-medium uppercase tracking-[0.2em] text-white/60 transition hover:text-white sm:flex">
        Scroll
        <ChevronDownIcon className="h-5 w-5 motion-safe:animate-scroll-cue" aria-hidden="true" />
      </a>
    </section>
  )
}

HeroSection.propTypes = {
  hero: PropTypes.object,
  numbers: PropTypes.object,
  entities: PropTypes.array.isRequired,
  /** Culture photos; the first two float beside the headline on large screens. */
  photos: PropTypes.array,
}

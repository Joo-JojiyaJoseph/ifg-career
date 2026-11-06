import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { BriefcaseIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { Aurora } from '@shared/ui/Aurora'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { AnimatedNumber } from '@shared/ui/Motion'
import { WordReveal } from '@shared/ui/WordReveal'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'
import { heroJobsQuery } from '../jobs/api'
import { EntityCollage } from './EntityCollage'
import { isPlaceholder } from './api'

const numberLabels = {
  employees: 'people across the group',
  years: 'years since 2016',
  clients: 'clients served',
  companies: 'companies, one group',
}

const stripCols = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }

/**
 * Section 2 of the guide: motto, company line, Job Search, and the group graphic (or HR's banner image).
 * The search box and company chips take people straight to matching roles.
 */
export function HeroSection({ hero, numbers, entities, interviewSteps = 0 }) {
  const reduced = usePrefersReducedMotion()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const enter = (delay) => (reduced ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: 'easeOut' } })
  const image = isPlaceholder(hero?.banner_image) ? null : hero.banner_image
  const jobs = useQuery(heroJobsQuery)
  const openRoles = jobs.data?.meta?.total
  const perEntity = jobs.data?.counts?.entity ?? {}
  const stats = [
    ...Object.entries(numbers ?? {}).filter(([, value]) => Number(value) > 0),
    ...(entities.length ? [['companies', entities.length]] : []),
  ]

  function search(event) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/jobs?q=${encodeURIComponent(q)}` : '/jobs', { viewTransition: true })
  }

  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <Aurora tone="dark" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dots-light bg-dots [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:pt-12 md:pb-16 md:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-12 2xl:max-w-7xl">
        <div className="min-w-0 max-w-xl">
          <m.p {...enter(0)} className="glass-dark inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium text-white/90">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 motion-safe:animate-pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {openRoles ? `We're hiring · ${openRoles} open ${openRoles === 1 ? 'role' : 'roles'}` : "We're hiring across the group"}
          </m.p>
          <WordReveal
            text={hero?.motto ?? 'Grow your career with Infolks Group'}
            delay={0.1}
            className="mt-6 font-display text-[clamp(2.15rem,4.2vw+1rem,3.9rem)] font-semibold leading-[1.06] tracking-tight"
          />
          {hero?.company_line ? (
            <m.p {...enter(0.45)} className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">{hero.company_line}</m.p>
          ) : null}

          <m.form {...enter(0.55)} onSubmit={search} role="search" className="glass-dark mt-8 flex items-center gap-2 rounded-full border p-1.5 pl-4 focus-within:border-cyan/60 focus-within:ring-4 focus-within:ring-cyan/15">
            <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
            <label htmlFor="hero-search" className="sr-only">Search roles</label>
            <input
              id="hero-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Role, skill or company"
              className="min-h-11 min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-0"
            />
            <button type="submit" className="shine inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-accent-orange to-[#F7B04B] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(243,146,35,0.7)] transition duration-200 hover:-translate-y-0.5 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-6 sm:text-base">
              <span className="hidden sm:inline">Job Search</span>
              <span className="sm:hidden">Search</span>
            </button>
          </m.form>

          {entities.length ? (
            <m.div {...enter(0.65)} className="mt-5 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-white/55">
              <span className="mr-1">Explore</span>
              {entities.map((entity) => (
                <Link
                  key={entity.slug}
                  to={`/jobs?entity=${entity.slug}`}
                  viewTransition
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-2.5 font-medium text-white/85 transition duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label={`${entity.name} roles${perEntity[entity.slug] ? `, ${perEntity[entity.slug]} open` : ''}`}
                >
                  <EntityLogo entity={entity} size="sm" className="!h-6 !w-6 !rounded-full !bg-white !text-[0.625rem]" />
                  {entity.name}
                </Link>
              ))}
            </m.div>
          ) : null}
        </div>

        <m.div className={`relative w-full md:mx-auto md:max-w-xl lg:max-w-none ${image ? '' : 'hidden sm:block'}`} {...(reduced ? {} : { initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] } })}>
          {image ? (
            <div className="glass-dark rounded-[2rem] border p-2">
              <img src={image} alt="People at work at Infolks Group" className="aspect-[4/3] w-full rounded-[1.6rem] object-cover" fetchPriority="high" width="800" height="600" />
            </div>
          ) : entities.length ? (
            <EntityCollage entities={entities} />
          ) : null}
          {image && openRoles ? (
            <FloatChip className="left-0 top-[8%] sm:-left-4" delay={0.9} icon={BriefcaseIcon} value={openRoles} label="open roles" />
          ) : null}
          {image && interviewSteps ? (
            <FloatChip className="bottom-[6%] right-0 sm:-right-2" delay={1.05} icon={SparklesIcon} value={interviewSteps} label="step interview" float="[animation-delay:-3s]" />
          ) : null}
        </m.div>
      </div>

      {stats.length ? (
        <div className="mx-auto max-w-6xl px-4 pb-12 md:pb-16 2xl:max-w-7xl">
          <dl className={`grid gap-y-6 border-t border-white/10 pt-8 ${stripCols[Math.min(stats.length, 4)]}`}>
            {stats.slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <dt className="order-2 mt-1 text-xs text-white/55 sm:text-sm">{numberLabels[key] ?? key}</dt>
                <dd className="order-1 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  <AnimatedNumber value={value} />{key === 'companies' ? '' : '+'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  )
}

HeroSection.propTypes = {
  hero: PropTypes.object,
  numbers: PropTypes.object,
  entities: PropTypes.array.isRequired,
  interviewSteps: PropTypes.number,
}

function FloatChip({ className, delay, icon: Icon, value, label, float = '' }) {
  const reduced = usePrefersReducedMotion()

  return (
    <m.div
      className={`absolute z-10 hidden sm:block ${className}`}
      {...(reduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay } })}
    >
      <div className={`glass-dark flex items-center gap-3 rounded-2xl border px-4 py-3 motion-safe:animate-float-slow ${float}`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-cyan text-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="leading-tight">
          <span className="block font-display text-lg font-semibold">{value}</span>
          <span className="block text-xs text-white/70">{label}</span>
        </span>
      </div>
    </m.div>
  )
}

FloatChip.propTypes = {
  className: PropTypes.string,
  delay: PropTypes.number,
  icon: PropTypes.elementType.isRequired,
  value: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  float: PropTypes.string,
}

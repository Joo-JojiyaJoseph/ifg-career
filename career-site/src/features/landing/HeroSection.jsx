import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { m } from 'framer-motion'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/24/solid'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { EntityArt } from '@shared/ui/illustrations/EntityArt'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'
import { heroJobsQuery } from '../jobs/api'

/**
 * Section 1 of the career page. Navy with a faint dot grid: on the left the hiring badge, "Be part of our heart",
 * the group name and motto, the company line, the job search and quick links to each company; on the right the
 * four companies as illustrated cards; along the bottom the company numbers.
 */
export function HeroSection({ hero, entities = [], numbers = null }) {
  const reduced = usePrefersReducedMotion()
  const navigate = useNavigate()
  const jobs = useQuery(heroJobsQuery)
  const open = jobs.data?.meta?.total
  const [query, setQuery] = useState('')
  const enter = (delay) => (reduced ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } })
  const stats = [
    numbers?.years ? { value: `${numbers.years}+`, label: 'years since 2016' } : null,
    numbers?.employees ? { value: `${Number(numbers.employees).toLocaleString('en-IN')}+`, label: 'people across the group' } : null,
    entities.length ? { value: String(entities.length), label: entities.length === 1 ? 'company, one group' : 'companies, one group' } : null,
    numbers?.clients ? { value: `${Number(numbers.clients).toLocaleString('en-IN')}+`, label: 'clients served' } : null,
  ].filter(Boolean)

  function search(event) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/jobs?q=${encodeURIComponent(q)}` : '/jobs', { viewTransition: true })
  }

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-800 via-navy to-ink text-white" aria-label={hero?.title ?? 'Infolks Group'}>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-[24rem] w-[40rem] rounded-full bg-violet/25 blur-3xl" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:pt-20 lg:pt-24 2xl:max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
          <div className="min-w-0">
            {open ? (
              <m.p {...enter(0)} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur sm:text-sm">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 motion-safe:animate-pulse-ring" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                We&rsquo;re hiring · {open} open {open === 1 ? 'role' : 'roles'}
              </m.p>
            ) : null}
            {hero?.eyebrow ? (
              <m.p {...enter(0.05)} className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 sm:text-sm">
                <HeartIcon className="h-4 w-4 text-rose-400 motion-safe:animate-heartbeat" aria-hidden="true" />
                {hero.eyebrow}
              </m.p>
            ) : null}
            <m.h1 {...enter(0.1)} className="mt-3 whitespace-nowrap font-display text-[clamp(2.4rem,6.4vw,4.6rem)] font-semibold leading-[1.02] tracking-tight">
              {hero?.title ?? 'Infolks Group'}
            </m.h1>
            <m.p {...enter(0.18)} className="mt-3 font-display text-[clamp(1.1rem,1.4vw+0.6rem,1.6rem)] font-medium">
              <span className="bg-gradient-to-r from-cyan-200 via-white to-amber-200 bg-clip-text text-transparent">{hero?.motto ?? 'A company with a heart'}</span>
            </m.p>
            {hero?.company_line ? <m.p {...enter(0.24)} className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{hero.company_line}</m.p> : null}

            <m.form {...enter(0.3)} onSubmit={search} role="search" className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white/10 p-1.5 pl-4 backdrop-blur focus-within:border-cyan/60 focus-within:ring-4 focus-within:ring-cyan/15">
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
              <button type="submit" className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-gradient-to-r from-accent-orange to-[#F7B04B] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(243,146,35,0.7)] transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-6 sm:text-base">
                Job Search
              </button>
            </m.form>

            {entities.length ? (
              <m.div {...enter(0.36)} className="mt-5 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
                <span className="mr-2 text-white/55">Explore</span>
                {entities.map((entity) => (
                  <Link key={entity.slug} to={`/jobs?entity=${entity.slug}`} viewTransition className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-medium text-white/90 transition duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <EntityLogo entity={entity} size="sm" className="!h-7 !w-7 !rounded-full !bg-white !text-[10px]" />
                    {entity.name}
                  </Link>
                ))}
              </m.div>
            ) : null}
          </div>

          {entities.length ? (
            <ul className="hidden grid-cols-2 gap-4 sm:grid lg:gap-5" aria-label="Companies in the group">
              {entities.slice(0, 4).map((entity, index) => (
                <m.li
                  key={entity.slug}
                  className={index % 2 ? 'translate-y-10' : ''}
                  {...(reduced ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: 0.25 + index * 0.08, ease: [0.22, 1, 0.36, 1] } })}
                >
                  <Link to={`/jobs?entity=${entity.slug}`} viewTransition className="group block rounded-[1.4rem] border border-white/15 bg-white/10 p-2 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <span className="block overflow-hidden rounded-2xl bg-white">
                      <EntityArt entity={entity} index={index} className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]" />
                    </span>
                    <span className="flex items-center gap-2.5 px-1.5 pb-1 pt-2.5">
                      <EntityLogo entity={entity} size="sm" className="!h-8 !w-8 shrink-0 !bg-white !text-[11px]" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-tight">{entity.name}</span>
                        <span className="block truncate text-xs text-white/70">{entity.motto}</span>
                      </span>
                    </span>
                  </Link>
                </m.li>
              ))}
            </ul>
          ) : null}
        </div>

        {stats.length ? (
          <dl className="mt-16 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 lg:mt-20">
            {stats.slice(0, 3).map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-white/60 sm:text-sm">{stat.label}</dt>
                <dd className="font-display text-2xl font-semibold sm:text-4xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  )
}

HeroSection.propTypes = {
  hero: PropTypes.object,
  entities: PropTypes.array,
  numbers: PropTypes.object,
}

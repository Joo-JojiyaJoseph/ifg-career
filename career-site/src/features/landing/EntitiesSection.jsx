import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { EntityArt } from '@shared/ui/illustrations/EntityArt'
import { Reveal, Stagger, StaggerItem } from '@shared/ui/Motion'
import { GROUP } from '@shared/brand'
import { useSpotlight } from '@shared/hooks/useSpotlight'
import { heroJobsQuery } from '../jobs/api'
import { SectionHeading } from './SectionHeading'

const story = [
  { year: '2016', text: 'Kerala’s first data labeling team, six people in Mannarkkad.' },
  { year: 'Today', text: 'Around 1,000 people across four companies.' },
]

/**
 * Section 3: a slim group-story banner, then one calm card per entity in its own colours.
 * Each card says what the company does, how many roles are open, and links to its website.
 */
export function EntitiesSection({ entities }) {
  const spot = useSpotlight()
  const jobs = useQuery(heroJobsQuery)
  const perEntity = jobs.data?.counts?.entity ?? {}

  if (!entities.length) return null

  return (
    <section className="bg-white py-20 md:py-28" aria-labelledby="entities-title">
      <div className="mx-auto max-w-5xl px-4">
        <SectionHeading id="entities-title" eyebrow="One group, four companies" title="Our entities" intro="Every open role across the group is listed on this careers site." />

        <Reveal className="relative isolate mb-6 overflow-hidden rounded-3xl bg-ink px-6 py-6 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-20 -z-10 h-56 w-56 rounded-full bg-brand-500/40 blur-3xl" aria-hidden="true" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">{GROUP.tagline}</p>
              <p className="mt-1 font-display text-xl font-semibold tracking-tight">From six people to a thousand</p>
            </div>
            <ol className="flex flex-col gap-4 sm:flex-row sm:gap-10">
              {story.map((item) => (
                <li key={item.year} className="max-w-[15rem]">
                  <p className="font-display text-sm font-semibold text-cyan-200">{item.year}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/70">{item.text}</p>
                </li>
              ))}
            </ol>
            <a
              href={GROUP.website}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border border-white/20 px-4 text-sm font-medium transition duration-200 hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:self-center"
            >
              infolksgroup.com <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </Reveal>

        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {entities.map((entity) => {
            const primary = entity.theme?.primary ?? '#1976D2'
            const accent = entity.theme?.accent ?? '#29B6F6'
            const open = perEntity[entity.slug] ?? 0
            const host = entity.website_url ? entity.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '') : null

            return (
              <StaggerItem key={entity.slug} className="h-full">
                <article
                  className="group relative isolate h-full overflow-hidden rounded-3xl bg-border/80 p-px transition duration-300 hover:-translate-y-1 hover:shadow-lift"
                  style={{ '--entity-primary': primary, '--entity-accent': accent }}
                >
                  <span
                    className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,var(--entity-accent)_70deg,var(--entity-primary)_140deg,transparent_200deg)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 motion-safe:animate-border-spin"
                    aria-hidden="true"
                  />
                  <div
                    {...spot}
                    className="spotlight flex h-full flex-col rounded-[calc(1.5rem-1px)] bg-white p-7 sm:p-8"
                    style={{ '--spot-color': `color-mix(in srgb, ${primary} 10%, transparent)` }}
                  >
                    <div className="-mx-3 -mt-3 mb-6 overflow-hidden rounded-2xl sm:-mx-4 sm:-mt-4">
                      <EntityArt entity={entity} className="block h-auto w-full transition duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <div className="flex items-center gap-4">
                      <EntityLogo entity={entity} size="lg" />
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-semibold text-ink">{entity.name}</h3>
                        {entity.motto ? <p className="text-sm font-medium text-[var(--entity-primary)]">{entity.motto}</p> : null}
                      </div>
                    </div>
                    {entity.description ? <p className="mt-5 flex-1 leading-relaxed text-muted">{entity.description}</p> : <span className="flex-1" />}
                    <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
                      <Link
                        to={`/jobs?entity=${entity.slug}`}
                        viewTransition
                        className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-semibold text-[var(--entity-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--entity-primary)]"
                        aria-label={`View roles at ${entity.name}`}
                      >
                        {open ? `View ${open} open ${open === 1 ? 'role' : 'roles'}` : 'View roles'}
                        <ArrowRightIcon className="h-4 w-4 transition duration-200 group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                      {host ? (
                        <a
                          href={entity.website_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm text-muted transition duration-200 hover:text-[var(--entity-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--entity-primary)]"
                        >
                          {host}
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">(opens {entity.name} website in a new tab)</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </section>
  )
}

EntitiesSection.propTypes = { entities: PropTypes.array.isRequired }

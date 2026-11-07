import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { Stagger, StaggerItem } from '@shared/ui/Motion'
import { Photo } from '@shared/ui/Photo'
import { heroJobsQuery } from '../jobs/api'
import { SectionHeading } from './SectionHeading'

/**
 * Section 2: "Our story has more than one way in". One tall photo card per company with a frosted panel
 * holding its name, what it does, a line about working there, and "Explore Opportunities".
 */
export function EntitiesSection({ entities, section }) {
  const jobs = useQuery(heroJobsQuery)
  const perEntity = jobs.data?.counts?.entity ?? {}

  if (!entities.length) return null

  return (
    <section id="entities" className="relative isolate scroll-mt-16 overflow-hidden bg-brand-50 py-20 md:py-28" aria-labelledby="entities-title">
      <div className="pointer-events-none absolute -right-40 top-10 -z-10 h-[28rem] w-[28rem] rounded-full bg-cyan/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-40 bottom-0 -z-10 h-[24rem] w-[24rem] rounded-full bg-violet/20 blur-3xl" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 2xl:max-w-7xl">
        <SectionHeading id="entities-title" title={section?.title ?? 'Our story has more than one way in'} intro={section?.intro ?? undefined} />

        <Stagger as="ul" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {entities.map((entity) => {
            const open = perEntity[entity.slug] ?? 0
            const tint = entity.theme?.primary ?? '#1976D2'
            return (
              <StaggerItem as="li" key={entity.slug} className="h-full">
                <article
                  className="group relative isolate flex h-full min-h-[30rem] flex-col justify-end overflow-hidden rounded-[2rem] text-white shadow-lift transition duration-300 hover:-translate-y-1.5"
                  style={{ '--tint': tint }}
                >
                  <Photo
                    src={entity.theme?.photo_url}
                    alt=""
                    className="!absolute inset-0 -z-10"
                    imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" aria-hidden="true" />
                  {open ? (
                    <span className="glass-ink absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold">
                      {open} open {open === 1 ? 'role' : 'roles'}
                    </span>
                  ) : null}

                  <div className="glass-ink m-3 flex flex-col rounded-[1.5rem] p-5">
                    <div className="flex items-start gap-3">
                      <EntityLogo entity={entity} size="sm" className="!rounded-xl !bg-white" />
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-semibold leading-tight">{entity.name}</h3>
                        {entity.motto ? <p className="mt-0.5 text-sm font-medium leading-snug text-[color-mix(in_srgb,var(--tint)_30%,white)]">{entity.motto}</p> : null}
                      </div>
                    </div>
                    {entity.description ? <p className="mt-4 text-sm leading-relaxed text-white/80">{entity.description}</p> : null}
                    <Link
                      to={`/jobs?entity=${entity.slug}`}
                      viewTransition
                      aria-label={`Explore opportunities at ${entity.name}`}
                      className="mt-5 inline-flex min-h-11 items-center justify-between gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink transition duration-200 hover:bg-[color-mix(in_srgb,var(--tint)_12%,white)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    >
                      Explore Opportunities
                      <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
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

EntitiesSection.propTypes = {
  entities: PropTypes.array.isRequired,
  section: PropTypes.shape({ title: PropTypes.string, intro: PropTypes.string }),
}

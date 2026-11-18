import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { EntityArt } from '@shared/ui/illustrations/EntityArt'
import { Stagger, StaggerItem } from '@shared/ui/Motion'
import { heroJobsQuery } from '../jobs/api'
import { SectionHeading } from './SectionHeading'

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const inWords = (count) => WORDS[count] ?? String(count)
const host = (url) => url?.replace(/^https?:\/\//, '').replace(/\/$/, '')

/**
 * Section 2: "Our story has more than one way in". One card per company, in the order HR sets (Infolks, Medrays,
 * Webfolks, Dataways): its illustration in the company's colours, name, what it does, a line about working there,
 * and the "Explore Opportunities" button that lists its open roles.
 */
export function EntitiesSection({ entities, section }) {
  const jobs = useQuery(heroJobsQuery)
  const perEntity = jobs.data?.counts?.entity ?? {}

  if (!entities.length) return null

  return (
    <section id="entities" className="scroll-mt-20 bg-white py-20 md:py-28" aria-labelledby="entities-title">
      <div className="mx-auto max-w-5xl px-4 2xl:max-w-6xl">
        <SectionHeading id="entities-title" eyebrow={entities.length === 1 ? 'One group' : `One group, ${inWords(entities.length)} companies`} title={section?.title ?? 'Our story has more than one way in'} intro={section?.intro || undefined} />

        <Stagger as="ul" className="grid gap-6 md:grid-cols-2">
          {entities.map((entity, index) => (
            <StaggerItem as="li" key={entity.slug} className="h-full">
              <EntityCard entity={entity} index={index} open={perEntity[entity.slug] ?? 0} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/** One company. The tint, motto colour and links follow the company's own theme. */
function EntityCard({ entity, index, open }) {
  const site = host(entity.website_url)

  return (
    <article
      style={{ '--tint': entity.theme?.primary ?? '#1976D2', '--glow': entity.theme?.accent ?? '#29B6F6' }}
      className="group flex h-full flex-col rounded-[1.75rem] border border-border bg-white p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="overflow-hidden rounded-[1.25rem] bg-[color-mix(in_srgb,var(--glow)_14%,white)]">
        <EntityArt entity={entity} index={index} className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col px-2 pb-1 pt-5">
        <div className="flex items-center gap-3">
          <EntityLogo entity={entity} size="md" />
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold leading-tight text-ink">{entity.name}</h3>
            {entity.motto ? <p className="mt-0.5 text-sm font-medium text-[var(--tint)]">{entity.motto}</p> : null}
          </div>
        </div>
        {entity.description ? <p className="mb-5 mt-4 leading-relaxed text-muted">{entity.description}</p> : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 border-t border-border pt-3">
          <Link
            to={`/jobs?entity=${entity.slug}`}
            viewTransition
            aria-label={`Explore opportunities at ${entity.name}`}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--tint)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Explore Opportunities{open ? ` · ${open} open` : ''}
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          {site ? (
            <a href={entity.website_url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted transition duration-200 hover:text-ink">
              {site}
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

EntityCard.propTypes = { entity: PropTypes.object.isRequired, index: PropTypes.number.isRequired, open: PropTypes.number.isRequired }

EntitiesSection.propTypes = {
  entities: PropTypes.array.isRequired,
  section: PropTypes.shape({ title: PropTypes.string, intro: PropTypes.string }),
}

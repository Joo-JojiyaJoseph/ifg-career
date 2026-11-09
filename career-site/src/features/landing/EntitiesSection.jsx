import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon, ArrowTopRightOnSquareIcon, BuildingOffice2Icon, CalendarDaysIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { GROUP } from '@shared/brand'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { EntityArt } from '@shared/ui/illustrations/EntityArt'
import { Stagger, StaggerItem } from '@shared/ui/Motion'
import { heroJobsQuery } from '../jobs/api'
import { SectionHeading } from './SectionHeading'

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const inWords = (count) => WORDS[count] ?? String(count)
const host = (url) => url?.replace(/^https?:\/\//, '').replace(/\/$/, '')

/**
 * Section 2: "Our story has more than one way in". A navy story strip about the group, then one card per company:
 * its illustration in the company's colours, name, what it does, a line about working there, its open roles
 * ("Explore Opportunities") and a link to its website.
 */
export function EntitiesSection({ entities, section, numbers = null }) {
  const jobs = useQuery(heroJobsQuery)
  const perEntity = jobs.data?.counts?.entity ?? {}

  if (!entities.length) return null

  return (
    <section id="entities" className="scroll-mt-20 bg-white py-20 md:py-28" aria-labelledby="entities-title">
      <div className="mx-auto max-w-5xl px-4 2xl:max-w-6xl">
        <SectionHeading id="entities-title" eyebrow={entities.length === 1 ? 'One group' : `One group, ${inWords(entities.length)} companies`} title={section?.title ?? 'Our story has more than one way in'} intro={section?.intro || 'Every open role across the group is listed on this careers site.'} />

        <StoryBand count={entities.length} numbers={numbers} />

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

/**
 * The group in one band: what unites the companies (from the career page content), then three facts with icons
 * and a link to the group website. Wording follows the real number of companies.
 */
function StoryBand({ count, numbers }) {
  const facts = [
    { icon: CalendarDaysIcon, value: '2016', label: 'Kerala’s first data labeling company, in Mannarkkad' },
    numbers?.employees ? { icon: UserGroupIcon, value: `${Number(numbers.employees).toLocaleString('en-IN')}+`, label: 'people across the group' } : null,
    { icon: BuildingOffice2Icon, value: String(count), label: count === 1 ? 'company, one group' : 'companies, one group' },
  ].filter(Boolean)

  return (
    <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink via-navy to-brand-800 p-6 text-white shadow-lift sm:p-8 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:items-center lg:gap-10">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-80 rounded-full bg-violet/25 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">{GROUP.tagline}</p>
        <p className="mt-2 font-display text-2xl font-semibold leading-snug [text-wrap:balance]">
          {count > 1 ? `A group of ${inWords(count)} businesses, united by a common purpose.` : 'One group, united by a common purpose.'}
        </p>
        <a href={GROUP.website} target="_blank" rel="noreferrer noopener" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-4 text-sm font-semibold transition duration-200 hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
          {host(GROUP.website)}
          <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
      <dl className="relative mt-7 grid gap-3 sm:grid-cols-3 lg:mt-0">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col-reverse justify-end rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
            <dt className="mt-1 text-sm leading-snug text-white/70">{fact.label}</dt>
            <dd className="flex items-center gap-2.5 font-display text-2xl font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-200" aria-hidden="true"><fact.icon className="h-5 w-5" /></span>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

StoryBand.propTypes = { count: PropTypes.number.isRequired, numbers: PropTypes.object }

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
  numbers: PropTypes.object,
}

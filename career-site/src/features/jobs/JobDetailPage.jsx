import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  DocumentTextIcon,
  FlagIcon,
  LinkIcon,
  MapPinIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { ErrorState } from '@shared/ui/ErrorState'
import { Photo } from '@shared/ui/Photo'
import { Skeleton } from '@shared/ui/Skeleton'
import { Stepper } from '@shared/ui/Stepper'
import { useToast } from '@shared/ui/Toast'
import { formatDate } from '@shared/lib/formatDate'
import { useCandidateAuth } from '../auth/AuthProvider'
import { startGoogleSignIn } from '../auth/api'
import { useQuickApply } from '../apply/quickApplyContext'
import { fetchPublicJob, publicIdFromParam } from './api'

/** "12 days left", "1 day left", "Closes today", or null when the role has no deadline. */
const daysLeft = (job) => (typeof job.days_left === 'number' ? (job.days_left === 0 ? 'Closes today' : `${job.days_left} ${job.days_left === 1 ? 'day' : 'days'} left`) : null)

/** How much of the application window is still open, from 0 to 1 (null without both dates). */
function windowLeft(job) {
  const start = Date.parse(job.posted_at)
  const end = Date.parse(job.last_date_to_apply)
  if (!start || !end || end <= start) return null
  return Math.min(1, Math.max(0.04, (end - Date.now()) / (end - start)))
}

/** Staggered entrance for the page's blocks (the animation itself respects reduced motion). */
const enter = 'motion-safe:animate-row-in'
const delay = (index) => ({ '--row-delay': `${index * 70}ms` })

/**
 * One role: a colourful hero in the hiring company's colours with the key facts, the description in clear
 * sections with icons, and a sticky apply card (a slim bar pinned to the bottom on phones).
 */
export function JobDetailPage() {
  const { jobRef } = useParams()
  const [params] = useSearchParams()
  const preview = params.get('preview')
  const publicId = publicIdFromParam(jobRef)
  const toast = useToast()
  const { candidate, loading } = useCandidateAuth()
  const jobQuery = useQuery({
    queryKey: ['public-job', publicId, preview],
    queryFn: () => fetchPublicJob(publicId, preview),
    enabled: Boolean(publicId),
    staleTime: 60_000,
  })

  const job = jobQuery.data

  useEffect(() => {
    if (!job) return undefined
    document.title = `${job.title} · ${job.entity?.name ?? 'Infolks Group'} Careers`
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(jobPostingJsonLd(job))
    document.head.appendChild(script)
    setMeta('og:title', job.title)
    setMeta('og:description', job.summary || job.title)
    setMeta('og:url', `${window.location.origin}${job.path}`)
    return () => {
      script.remove()
      document.title = 'Infolks Group Careers'
    }
  }, [job])

  if (!publicId) return <ErrorState title="That role link is not valid" />
  if (jobQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <Skeleton className="h-72 rounded-[2rem]" />
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-96" />
          <Skeleton className="hidden h-60 md:block" />
        </div>
      </div>
    )
  }
  if (jobQuery.isError || !job) return <div className="mx-auto max-w-5xl px-4 py-8"><ErrorState title="This role is not available" onRetry={() => jobQuery.refetch()} /></div>

  const accent = job.entity?.theme?.accent || '#1976D2'
  const primary = job.entity?.theme?.primary || '#0B4FA3'
  const cover = job.entity?.theme?.photo_url

  async function share() {
    const url = `${window.location.origin}${job.path}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const field = document.createElement('textarea')
      field.value = url
      field.setAttribute('readonly', '')
      document.body.appendChild(field)
      field.select()
      document.execCommand('copy')
      field.remove()
    }
    toast.push({ tone: 'success', message: 'Link copied' })
  }

  const facts = [
    { label: 'Department', value: job.department?.name, icon: BuildingOffice2Icon },
    { label: 'Team', value: job.team?.name, icon: UserGroupIcon },
    { label: 'Location', value: job.location, icon: MapPinIcon },
    { label: 'Posted', value: formatDate(job.posted_at), icon: CalendarDaysIcon },
    { label: 'Last date to apply', value: job.last_date_to_apply ? formatDate(job.last_date_to_apply) : null, icon: ClockIcon },
  ].filter((fact) => fact.value)

  return (
    <article className="mx-auto max-w-6xl px-4 pb-28 pt-3 sm:pt-4 md:pb-12" style={{ '--entity-accent': accent, '--entity-primary': primary }}>
      <Link to="/jobs" viewTransition className="group inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-medium text-muted transition hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
        All jobs
      </Link>

      {/* The hero: soft colour glows in the company's colours, its cover photo fading in on the right. */}
      <header className={`relative isolate mt-1 overflow-hidden rounded-3xl border border-white/80 bg-white p-4 shadow-lift sm:p-6 ${enter}`}>
        <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[var(--entity-primary)] opacity-[0.16] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 right-0 -z-10 h-80 w-80 rounded-full bg-[var(--entity-accent)] opacity-[0.18] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-dots [background-size:18px_18px] [mask-image:linear-gradient(180deg,#000,transparent_70%)] opacity-60" aria-hidden="true" />
        {cover ? (
          <Photo src={cover} alt="" className="!absolute inset-y-0 right-0 -z-10 hidden w-1/2 opacity-[0.22] [mask-image:linear-gradient(90deg,transparent,#000_85%)] lg:block" sizes="600px" />
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {job.entity ? (
              <span className="rounded-2xl bg-white p-0.5 shadow-card ring-1 ring-white">
                <EntityLogo entity={job.entity} size="md" className="rounded-xl" />
              </span>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <EntityBadge entity={job.entity} />
              {job.level?.value ? <Badge color={job.level.color}>{job.level.label}</Badge> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={share}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 text-sm font-medium text-navy shadow-card backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:px-4"
          >
            <LinkIcon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Copy link</span>
          </button>
        </div>

        <h1 className="mt-3 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">{job.title}</h1>
        {job.entity?.motto ? <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{job.entity.motto}</p> : null}
        {daysLeft(job) ? (
          <p className={`mt-3 inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${job.days_left <= 7 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping ${job.days_left <= 7 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${job.days_left <= 7 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </span>
            Hiring now · {daysLeft(job)}
          </p>
        ) : null}

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
          {facts.map((fact) => (
            <Fact key={fact.label} {...fact} />
          ))}
        </dl>
      </header>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_290px] lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-4">
          <div className={`flex flex-col divide-y divide-border/70 rounded-3xl border border-white/80 bg-white shadow-card ${enter}`} style={delay(1)}>
            <Section title="Role summary" icon={DocumentTextIcon}>{job.summary}</Section>
            <Section title="Qualification" icon={AcademicCapIcon}>{job.qualification}</Section>
            <Section title="Experience" icon={BriefcaseIcon}>{job.experience}</Section>
            {job.skills?.length ? (
              <Section title="Skills" icon={CpuChipIcon}>
                <ul className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <li
                      key={skill.slug}
                      className="rounded-full border border-[color-mix(in_srgb,var(--entity-primary)_22%,white)] bg-gradient-to-b from-white to-[color-mix(in_srgb,var(--entity-primary)_7%,white)] px-3 py-1 text-xs font-medium text-navy shadow-sm transition duration-200 hover:-translate-y-0.5"
                    >
                      {skill.name}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </div>

          {job.why_join_us ? (
            <section className={`relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--entity-primary)] to-[var(--entity-accent)] p-4 text-white shadow-lift sm:px-6 sm:py-5 ${enter}`} style={delay(2)}>
              <div className="pointer-events-none absolute -right-10 -top-10 -z-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-0 -z-10 bg-dots-light [background-size:16px_16px] opacity-60" aria-hidden="true" />
              <h2 className="flex items-center gap-2.5 font-display text-base font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                  <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                Why join us
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/90 sm:pl-[2.6rem]">{job.why_join_us}</p>
            </section>
          ) : null}

          {job.interview_steps?.length ? (
            <section className={`rounded-3xl border border-white/80 bg-white p-4 shadow-card sm:px-6 sm:py-5 ${enter}`} style={delay(3)}>
              <SectionTitle icon={FlagIcon}>Interview process</SectionTitle>
              <p className="mt-0.5 pl-[2.6rem] text-xs text-muted">What to expect after you apply.</p>
              <div className="mt-4">
                <Stepper steps={job.interview_steps} compact />
              </div>
            </section>
          ) : null}
          <AboutEntity entity={job.entity} className="md:hidden" />
        </div>
        <aside className={`hidden self-stretch md:block ${enter}`} style={delay(1)}>
          <div className="sticky top-24 flex flex-col gap-4">
            <ApplyPanel job={job} candidate={candidate} loading={loading} />
            <AboutEntity entity={job.entity} />
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/60 bg-white/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-glass backdrop-blur-xl md:hidden">
        <ApplyPanel job={job} candidate={candidate} loading={loading} compact />
      </div>
    </article>
  )
}

/** The company in a small card: logo, name, a line about it, its other roles and its website. */
function AboutEntity({ entity, className = '' }) {
  if (!entity) return null
  const host = entity.website_url?.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <section className={`rounded-3xl border border-white/80 bg-white p-4 shadow-card transition duration-200 hover:shadow-card-hover ${className}`} aria-label={`About ${entity.name}`}>
      <div className="flex items-center gap-3">
        <EntityLogo entity={entity} size="md" className="rounded-2xl" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">About the company</p>
          <p className="truncate font-display text-base font-semibold text-navy">{entity.name}</p>
        </div>
      </div>
      {entity.short_description ? <p className="mt-2 text-sm leading-relaxed text-muted">{entity.short_description}</p> : null}
      <div className="mt-1 flex flex-wrap gap-x-4">
        <Link to={`/jobs?entity=${entity.slug}`} viewTransition className="group inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--entity-primary)] hover:underline">
          More roles at {entity.name}
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
        {host ? (
          <a href={entity.website_url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-[var(--entity-primary)]">
            {host} <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </section>
  )
}

AboutEntity.propTypes = { entity: PropTypes.object, className: PropTypes.string }

function Fact({ label, value, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/90 bg-white/85 px-2.5 py-2 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-card">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--entity-primary)_10%,white)] text-[var(--entity-primary)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] text-muted">{label}</dt>
        <dd className="break-words text-sm font-semibold leading-snug text-ink">{value}</dd>
      </div>
    </div>
  )
}

Fact.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string, icon: PropTypes.elementType.isRequired }

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-2.5 font-display text-base font-semibold text-navy">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--entity-primary)] to-[var(--entity-accent)] text-white shadow-md">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {children}
    </h2>
  )
}

SectionTitle.propTypes = { icon: PropTypes.elementType.isRequired, children: PropTypes.node }

function Section({ title, icon, children }) {
  if (!children) return null
  return (
    <section className="px-4 py-4 sm:px-6">
      <SectionTitle icon={icon}>{title}</SectionTitle>
      {typeof children === 'string' ? <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-text sm:pl-[2.6rem]">{children}</p> : <div className="mt-2.5 sm:pl-[2.6rem]">{children}</div>}
    </section>
  )
}

Section.propTypes = { title: PropTypes.string.isRequired, icon: PropTypes.elementType.isRequired, children: PropTypes.node }

/**
 * How to apply: the deadline with a bar showing how much of the window is left, the main button and, for guests,
 * why we ask them to sign in. Candidates who already applied get a link to their applications instead.
 * `compact` is the slim bar pinned to the bottom of the screen on phones.
 */
function ApplyPanel({ job, candidate, loading, compact = false }) {
  const { openQuickApply } = useQuickApply()
  if (loading) return <Skeleton className={compact ? 'h-12' : 'h-56'} />
  const eligibility = candidate ? job.eligibility : null
  const applied = eligibility?.code === 'already_applied'
  const blocked = eligibility && eligibility.eligible === false && !applied
  const left = daysLeft(job)
  const remaining = windowLeft(job)
  const urgent = typeof job.days_left === 'number' && job.days_left <= 7

  const action = applied ? (
    <Link to="/my-applications" viewTransition className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 font-semibold text-emerald-800 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
      <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
      {compact ? 'Applied · track it' : 'Applied · track your application'}
    </Link>
  ) : blocked ? null : candidate ? (
    <Link to={`/jobs/${job.public_id}/apply`} className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-700 to-brand-500 px-5 font-semibold text-white shadow-lg shadow-brand-500/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
      Apply now
      <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  ) : (
    <Button className="min-h-12 w-full whitespace-nowrap shadow-lg shadow-brand-500/30 hover:shadow-glow" onClick={() => startGoogleSignIn(`/jobs/${job.public_id}/apply`)}>
      {compact ? 'Sign in to apply' : 'Sign in with Google to apply'}
    </Button>
  )

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 text-xs text-muted">
          <p className="truncate font-semibold text-ink">{job.title}</p>
          {left ? <p className={`truncate ${urgent ? 'font-medium text-amber-700' : ''}`}>{left}</p> : null}
        </div>
        <div className="w-48 shrink-0">{blocked ? <p className="text-xs text-navy">{eligibility.message}</p> : action}</div>
      </div>
    )
  }

  return (
    // A thin gradient border in the company's colours around a white card.
    <div className="rounded-3xl bg-gradient-to-br from-[var(--entity-primary)] via-[color-mix(in_srgb,var(--entity-accent)_60%,white)] to-[var(--entity-accent)] p-px shadow-lift">
      <div className="rounded-[calc(1.5rem-1px)] bg-white p-5">
        <p className="font-display text-lg font-semibold text-navy">{applied ? 'You have applied' : 'Interested in this role?'}</p>
        <p className="mt-0.5 text-sm text-muted">{applied ? 'Follow its progress in My Applications.' : 'It takes a few minutes to apply.'}</p>
        {job.last_date_to_apply ? (
          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-muted">Apply by {formatDate(job.last_date_to_apply)}</span>
              {left ? <span className={`font-semibold ${urgent ? 'text-amber-700' : 'text-ink'}`}>{left}</span> : null}
            </div>
            {remaining !== null ? (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="presentation">
                <div
                  className={`h-full w-full origin-left scale-x-[var(--left)] rounded-full transition-transform duration-200 ${urgent ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-[var(--entity-primary)] to-[var(--entity-accent)]'}`}
                  style={{ '--left': remaining }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4">{blocked ? <p className="rounded-2xl bg-brand-50 p-3 text-sm text-navy">{eligibility.message}</p> : action}</div>
        {!candidate ? <p className="mt-3 text-center text-xs leading-relaxed text-muted">Signing in keeps your applications and their status together in one place.</p> : null}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5 ring-1 ring-border/60">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="text-sm text-muted">
            Not quite the right fit?{' '}
            <a href="/#quick-apply" onClick={openQuickApply} className="font-semibold text-brand-700 hover:underline">Share your profile</a>
          </p>
        </div>
      </div>
    </div>
  )
}

ApplyPanel.propTypes = {
  job: PropTypes.object.isRequired,
  candidate: PropTypes.object,
  loading: PropTypes.bool,
  compact: PropTypes.bool,
}

function jobPostingJsonLd(job) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.summary,
    datePosted: job.posted_at,
    validThrough: job.last_date_to_apply,
    employmentType: job.level?.value === 'internship' ? 'INTERN' : 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.entity?.name,
    },
    jobLocation: {
      '@type': 'Place',
      address: job.location,
    },
  }
}

function setMeta(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

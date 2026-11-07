import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowTopRightOnSquareIcon, ShareIcon } from '@heroicons/react/24/outline'
import { Aurora } from '@shared/ui/Aurora'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { EntityArt } from '@shared/ui/illustrations/EntityArt'
import { Photo } from '@shared/ui/Photo'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { Stepper } from '@shared/ui/Stepper'
import { useToast } from '@shared/ui/Toast'
import { formatDate } from '@shared/lib/formatDate'
import { useCandidateAuth } from '../auth/AuthProvider'
import { startGoogleSignIn } from '../auth/api'
import { fetchPublicJob, publicIdFromParam } from './api'

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
  if (jobQuery.isLoading) return <div className="mx-auto max-w-5xl px-4 py-8"><Skeleton className="h-80" /></div>
  if (jobQuery.isError || !job) return <div className="mx-auto max-w-5xl px-4 py-8"><ErrorState title="This role is not available" onRetry={() => jobQuery.refetch()} /></div>

  const accent = job.entity?.theme?.accent || '#1976D2'
  const primary = job.entity?.theme?.primary || '#0B4FA3'
  const pattern = job.entity?.theme?.pattern_url ? `url(${job.entity.theme.pattern_url})` : 'none'

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

  return (
    <article className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-12" style={{ '--entity-accent': accent, '--entity-primary': primary, '--entity-pattern': pattern }}>
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-lift sm:p-8">
        <Aurora tone="dark" className="opacity-60" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_0%,var(--entity-primary),transparent_55%)] opacity-80" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[image:var(--entity-pattern)] bg-cover opacity-10" aria-hidden="true" />
        <div className="flex flex-col-reverse items-start justify-between gap-4 sm:flex-row">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{job.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EntityBadge entity={job.entity} />
              {job.level?.value ? <Badge color={job.level.color}>{job.level.label}</Badge> : null}
              {typeof job.days_left === 'number' ? <Badge color={job.days_left <= 7 ? 'amber' : 'blue'}>{job.days_left === 0 ? 'Closes today' : `Closes in ${job.days_left} days`}</Badge> : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {job.entity ? <EntityLogo entity={job.entity} size="xl" className="!bg-white shadow-glow" /> : null}
            <Button variant="secondary" icon={ShareIcon} onClick={share}>Share</Button>
          </div>
        </div>
        {job.entity?.motto ? <p className="mt-4 text-white/80">{job.entity.motto}</p> : null}
        <dl className="mt-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
          <Fact label="Department" value={job.department?.name || '—'} />
          <Fact label="Team" value={job.team?.name || '—'} />
          <Fact label="Location" value={job.location} />
          <Fact label="Posted" value={formatDate(job.posted_at)} />
          <Fact label="Last date to apply" value={formatDate(job.last_date_to_apply)} />
        </dl>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-8 rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
          <Section title="Role summary">{job.summary}</Section>
          <Section title="Qualification">{job.qualification}</Section>
          <Section title="Experience">{job.experience}</Section>
          {job.why_join_us ? <Section title="Why join us">{job.why_join_us}</Section> : null}
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(job.skills ?? []).map((skill) => (
                <Badge key={skill.slug} color="sky">{skill.name}</Badge>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold text-ink">Interview process</h2>
            <Stepper steps={job.interview_steps ?? []} />
          </section>
        </div>
        <AboutEntity entity={job.entity} className="md:hidden" />
        <aside className="hidden md:block">
          <div className="sticky top-24 flex flex-col gap-4">
            <ApplyPanel job={job} candidate={candidate} loading={loading} />
            <AboutEntity entity={job.entity} />
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/60 bg-white/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-glass backdrop-blur-xl md:hidden">
        <ApplyPanel job={job} candidate={candidate} loading={loading} />
      </div>
    </article>
  )
}

function AboutEntity({ entity, className = '' }) {
  if (!entity) return null
  const host = entity.website_url?.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <section className={`glass overflow-hidden rounded-3xl p-5 md:bg-white/80 ${className}`} aria-label={`About ${entity.name}`}>
      {entity.theme?.photo_url ? (
        <Photo src={entity.theme.photo_url} alt="" className="-mx-5 -mt-5 mb-4 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none" sizes="(min-width: 1024px) 360px, 100vw" />
      ) : (
        <EntityArt entity={entity} className="-mx-5 -mt-5 mb-4 block h-auto w-[calc(100%+2.5rem)] max-w-none" />
      )}
      <div className="flex items-center gap-3">
        <EntityLogo entity={entity} size="md" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">About the company</p>
          <p className="font-display text-lg font-semibold text-ink">{entity.name}</p>
        </div>
      </div>
      {entity.short_description ? <p className="mt-3 text-sm leading-relaxed text-muted">{entity.short_description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-x-4">
        <Link to={`/jobs?entity=${entity.slug}`} viewTransition className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--entity-primary)] hover:underline">
          More roles at {entity.name}
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

function Fact({ label, value }) {
  return (
    <div className="glass-dark min-w-0 rounded-2xl border px-3 py-2.5">
      <dt className="text-xs text-white/60">{label}</dt>
      <dd className="mt-0.5 break-words font-medium leading-snug text-white">{value}</dd>
    </div>
  )
}

Fact.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string }

function Section({ title, children }) {
  return (
    <section>
      <h2 className="flex items-center gap-3 font-display text-xl font-semibold text-ink">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-[var(--entity-accent)] to-[var(--entity-primary)]" aria-hidden="true" />
        {title}
      </h2>
      <p className="mt-3 whitespace-pre-line leading-relaxed text-text">{children}</p>
    </section>
  )
}

function ApplyPanel({ job, candidate, loading }) {
  if (loading) return <Skeleton className="h-24" />
  const blocked = candidate && job.eligibility && job.eligibility.eligible === false

  return (
    <div className="relative overflow-hidden md:glass md:rounded-3xl md:bg-white/80 md:p-5">
      <div className="absolute inset-x-0 top-0 hidden h-1 bg-gradient-to-r from-[var(--entity-accent)] to-[var(--entity-primary)] md:block" aria-hidden="true" />
      {blocked ? <p className="text-sm text-navy">{job.eligibility.message}</p> : null}
      {!candidate ? (
        <Button className="w-full" onClick={() => startGoogleSignIn(`/jobs/${job.public_id}/apply`)}>
          Sign in with Google
        </Button>
      ) : null}
      {candidate && !blocked ? (
        <Link to={`/jobs/${job.public_id}/apply`} className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 text-sm font-medium text-white">
          Apply
        </Link>
      ) : null}
    </div>
  )
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

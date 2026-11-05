import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShareIcon } from '@heroicons/react/24/outline'
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
    <article className="mx-auto max-w-5xl px-4 py-8" style={{ '--entity-accent': accent, '--entity-primary': primary, '--entity-pattern': pattern }}>
      <header className="rounded-2xl border border-l-4 border-border bg-white bg-[image:var(--entity-pattern)] bg-cover p-6 shadow-card border-l-[var(--entity-accent)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-navy">{job.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EntityBadge entity={job.entity} />
              {job.level?.value ? <Badge color={job.level.color}>{job.level.label}</Badge> : null}
              {typeof job.days_left === 'number' ? <Badge color={job.days_left <= 7 ? 'amber' : 'blue'}>{job.days_left === 0 ? 'Closes today' : `Closes in ${job.days_left} days`}</Badge> : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {job.entity?.theme?.logo_url ? <img src={job.entity.theme.logo_url} alt="" width="64" height="64" className="h-16 w-16 object-contain" /> : null}
            <Button variant="secondary" icon={ShareIcon} onClick={share}>Share</Button>
          </div>
        </div>
        {job.entity?.motto ? <p className="mt-4 text-brand-700">{job.entity.motto}</p> : null}
        <dl className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <div>Department: <span className="text-text">{job.department?.name || '—'}</span></div>
          <div>Team: <span className="text-text">{job.team?.name || '—'}</span></div>
          <div>Location: <span className="text-text">{job.location}</span></div>
          <div>Posted: <span className="text-text">{formatDate(job.posted_at)}</span></div>
          <div>Last date to apply: <span className="text-text">{formatDate(job.last_date_to_apply)}</span></div>
        </dl>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-6">
          <Section title="Role summary">{job.summary}</Section>
          <Section title="Qualification">{job.qualification}</Section>
          <Section title="Experience">{job.experience}</Section>
          {job.why_join_us ? <Section title="Why join us">{job.why_join_us}</Section> : null}
          <section>
            <h2 className="font-display text-xl text-navy">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(job.skills ?? []).map((skill) => (
                <Badge key={skill.slug} color="sky">{skill.name}</Badge>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 font-display text-xl text-navy">Interview process</h2>
            <Stepper steps={job.interview_steps ?? []} />
          </section>
        </div>
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <ApplyPanel job={job} candidate={candidate} loading={loading} />
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white p-3 md:hidden">
        <ApplyPanel job={job} candidate={candidate} loading={loading} />
      </div>
    </article>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-xl text-navy">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-text">{children}</p>
    </section>
  )
}

function ApplyPanel({ job, candidate, loading }) {
  if (loading) return <Skeleton className="h-24" />
  const blocked = candidate && job.eligibility && job.eligibility.eligible === false

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-card">
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

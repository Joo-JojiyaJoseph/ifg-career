import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@shared/ui/Button'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { useCandidateAuth } from '../auth/AuthProvider'
import { startGoogleSignIn } from '../auth/api'
import { fetchPublicJob, publicIdFromParam } from './api'

/** Placeholder until the application form is built. Eligibility is already enforced on the role page. */
export function ApplyStubPage() {
  const { jobRef } = useParams()
  const publicId = publicIdFromParam(jobRef)
  const { candidate, loading } = useCandidateAuth()
  const jobQuery = useQuery({
    queryKey: ['public-job', publicId, null],
    queryFn: () => fetchPublicJob(publicId),
    enabled: Boolean(publicId),
  })

  if (loading || jobQuery.isLoading) return <div className="mx-auto max-w-xl px-4 py-10"><Skeleton className="h-40" /></div>
  if (!candidate) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
        <h1 className="font-display text-3xl text-navy">Sign in to apply</h1>
        <Button onClick={() => startGoogleSignIn(`/jobs/${publicId}/apply`)}>Sign in with Google</Button>
      </div>
    )
  }
  if (jobQuery.isError) return <div className="mx-auto max-w-xl px-4 py-10"><ErrorState title="This role is not open for applications" /></div>

  const job = jobQuery.data
  if (job?.eligibility && job.eligibility.eligible === false) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-display text-3xl text-navy">{job.title}</h1>
        <p className="mt-3 text-navy">{job.eligibility.message}</p>
        <Link className="mt-6 inline-flex min-h-11 items-center text-brand-700" to={job.path}>Back to the role</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl text-navy">Apply for {job?.title}</h1>
      <p className="mt-3 text-muted">The application form will be available in the next phase. Your eligibility for this role has been checked.</p>
      <Link className="mt-6 inline-flex min-h-11 items-center text-brand-700" to={job?.path || '/jobs'}>Back to the role</Link>
    </div>
  )
}

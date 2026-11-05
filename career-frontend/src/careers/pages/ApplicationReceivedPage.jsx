import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { Card } from '@shared/ui/Card'
import { publicIdFromParam } from '../features/jobs/api'

export function ApplicationReceivedPage() {
  const { jobRef } = useParams()
  const location = useLocation()
  const message = location.state?.message || 'We received your application.'
  const publicId = publicIdFromParam(jobRef)

  useEffect(() => {
    document.title = 'Application received · Infolks Group Careers'
  }, [])

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CheckCircleIcon className="h-10 w-10 text-success" aria-hidden="true" />
        <h1 className="mt-3 font-display text-3xl text-navy">Application received</h1>
        <p className="mt-3 text-text">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link className="inline-flex min-h-11 items-center text-brand-700" to="/my-applications">My Applications</Link>
          {publicId ? <Link className="inline-flex min-h-11 items-center text-brand-700" to={`/jobs/${publicId}`}>Back to the role</Link> : null}
        </div>
      </Card>
    </div>
  )
}

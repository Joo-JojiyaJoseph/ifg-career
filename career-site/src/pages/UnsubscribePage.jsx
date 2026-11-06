import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellSlashIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { fetchSubscription, resubscribe, unsubscribe } from '../features/subscription/api'

export function UnsubscribePage() {
  const { token } = useParams()
  const toast = useToast()
  const queryClient = useQueryClient()
  const key = ['subscription', token]
  const status = useQuery({ queryKey: key, queryFn: () => fetchSubscription(token), retry: false })

  const change = useMutation({
    mutationFn: (subscribe) => (subscribe ? resubscribe(token) : unsubscribe(token)),
    onSuccess: (result) => {
      queryClient.setQueryData(key, result.data)
      toast.push({ tone: 'success', message: result.message })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  const member = status.data

  return (
    <section className="bg-brand-50 px-4 py-16 sm:py-24">
      <Card className="mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
        {status.isLoading ? <Skeleton className="h-40 w-full" /> : null}
        {status.isError ? (
          status.error?.status === 404 ? (
            <>
              <EnvelopeIcon className="h-12 w-12 text-muted" aria-hidden="true" />
              <h1 className="font-display text-2xl font-semibold text-navy">This link is not valid</h1>
              <p className="text-muted">It may have been copied incompletely. Use the unsubscribe link in the latest email from Infolks Group.</p>
            </>
          ) : (
            <ErrorState onRetry={() => status.refetch()} />
          )
        ) : null}
        {member ? (
          member.is_subscribed ? (
            <>
              <BellSlashIcon className="h-12 w-12 text-brand-600" aria-hidden="true" />
              <h1 className="font-display text-2xl font-semibold text-navy">Unsubscribe from job alerts?</h1>
              <p className="text-muted">
                {member.first_name ? `${member.first_name}, you` : 'You'} receive job alerts and company updates at <span className="font-medium text-text">{member.email_hint}</span>.
                Application confirmation emails are still sent.
              </p>
              <Button variant="danger" loading={change.isPending} onClick={() => change.mutate(false)}>Unsubscribe</Button>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-12 w-12 text-success" aria-hidden="true" />
              <h1 className="font-display text-2xl font-semibold text-navy">You're unsubscribed</h1>
              <p className="text-muted">You will no longer receive job alerts or company updates at {member.email_hint}. Changed your mind?</p>
              <Button variant="secondary" loading={change.isPending} onClick={() => change.mutate(true)}>Subscribe again</Button>
            </>
          )
        ) : null}
        <Link to="/jobs" className="mt-2 text-sm font-medium text-brand-700 underline">Browse open roles</Link>
      </Card>
    </section>
  )
}

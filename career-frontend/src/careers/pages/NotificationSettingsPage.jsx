import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client, ensureCsrf } from '@shared/api/createClient'
import { Card } from '@shared/ui/Card'
import { Checkbox } from '@shared/ui/Input'
import { EmptyState } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { useCandidateAuth } from '../features/auth/AuthProvider'

export function NotificationSettingsPage() {
  const { candidate, loading } = useCandidateAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: async (isSubscribed) => {
      await ensureCsrf()
      const { data } = await client.put('/api/v1/candidate/subscription', { is_subscribed: isSubscribed })
      return data
    },
    onSuccess: (_data, isSubscribed) => {
      queryClient.invalidateQueries({ queryKey: ['candidate', 'me'] })
      toast.push({
        tone: 'success',
        message: isSubscribed ? "You're in the talent community." : 'You will no longer get talent community emails.',
      })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  useEffect(() => {
    document.title = 'Notifications · Infolks Group Careers'
  }, [])

  if (!loading && !candidate) {
    return <EmptyState title="Sign in to manage notifications" description="Talent community emails are tied to the Google account you use here." />
  }
  if (!candidate) return null

  return (
    <Card>
      <h1 className="font-display text-3xl text-navy">Notifications</h1>
      <p className="mt-2 text-sm text-muted">Talent community updates from Infolks Group.</p>
      <div className="mt-6">
        <Checkbox
          label="Email me about new roles"
          checked={Boolean(candidate.talent_subscribed)}
          disabled={save.isPending}
          onChange={(event) => save.mutate(event.target.checked)}
        />
      </div>
    </Card>
  )
}

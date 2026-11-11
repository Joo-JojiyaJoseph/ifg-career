import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@shared/ui/Button'
import { Card, PageHeader } from '@shared/ui/Card'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { Switch } from '@shared/ui/Switch'
import { useToast } from '@shared/ui/Toast'
import { useUnsavedChanges } from '@shared/hooks/useUnsavedChanges'
import { fetchPreferences, savePreferences } from './api'

export function NotificationPreferencesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const prefs = useQuery({ queryKey: ['hr-notification-preferences'], queryFn: fetchPreferences })
  const [draft, setDraft] = useState(null)
  const [source, setSource] = useState(null)

  if (prefs.data && prefs.data !== source) {
    setSource(prefs.data)
    setDraft(prefs.data)
  }

  const dirty = Boolean(draft && source && JSON.stringify(draft) !== JSON.stringify(source))
  const leaveDialog = useUnsavedChanges(dirty)

  const save = useMutation({
    mutationFn: () => savePreferences(draft.map(({ type, in_app, email }) => ({ type, in_app, email }))),
    onSuccess: (data) => {
      queryClient.setQueryData(['hr-notification-preferences'], data)
      toast.push({ tone: 'success', message: 'Notification preferences saved' })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  function set(type, key, value) {
    setDraft((current) => current.map((item) => (item.type === type ? { ...item, [key]: value } : item)))
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Notification preferences"
        subtitle="Choose what appears in the bell and what is also emailed to you."
        actions={<Button loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>Save preferences</Button>}
      />
      {prefs.isLoading ? <Skeleton className="h-96" /> : null}
      {prefs.isError ? <ErrorState onRetry={() => prefs.refetch()} /> : null}
      {draft ? (
        <Card className="p-0">
          <div className="hidden grid-cols-[1fr_7rem_7rem] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
            <span>Notification</span>
            <span>In the portal</span>
            <span>Email</span>
          </div>
          <ul className="divide-y divide-border">
            {draft.map((item) => (
              <li key={item.type} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_7rem_7rem] sm:items-center sm:gap-4">
                <div>
                  <p className="font-medium text-navy">{item.label}</p>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
                <Switch checked={item.in_app} disabled={item.email_only} onChange={(value) => set(item.type, 'in_app', value)} label={`${item.label} in the portal`} srOnlyLabel />
                <Switch checked={item.email} onChange={(value) => set(item.type, 'email', value)} label={`${item.label} by email`} srOnlyLabel />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      {leaveDialog}
    </div>
  )
}

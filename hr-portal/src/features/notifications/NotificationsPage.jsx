import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AdjustmentsHorizontalIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { Card, PageHeader } from '@shared/ui/Card'
import { DateInput } from '@shared/ui/DateInput'
import { ErrorState } from '@shared/ui/ErrorState'
import { FilterBar } from '@shared/ui/FilterBar'
import { FormField } from '@shared/ui/FormField'
import { NotificationItem } from '@shared/ui/NotificationItem'
import { Pagination } from '@shared/ui/Pagination'
import { ResultCount } from '@shared/ui/ResultCount'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { Tabs } from '@shared/ui/Tabs'
import { fetchNotifications, fetchPreferences } from './api'
import { useNotifications } from './useNotifications'

export function NotificationsPage() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(params.entries())
  const bell = useNotifications()
  const list = useQuery({
    queryKey: ['hr-notifications', 'list', filters],
    queryFn: () => fetchNotifications({ ...filters, per_page: 20 }),
    placeholderData: keepPreviousData,
  })
  const types = useQuery({ queryKey: ['hr-notification-preferences'], queryFn: fetchPreferences, staleTime: 300_000 })

  function update(patch) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  const rows = list.data?.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Notifications"
        subtitle="Everything that needs your attention, newest first."
        actions={
          <>
            <Button variant="secondary" icon={CheckIcon} onClick={bell.markAll} disabled={!bell.count}>Mark all as read</Button>
            <Link to="/account/notifications" className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-brand-700 hover:bg-brand-100">
              <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" /> Preferences
            </Link>
          </>
        }
      />
      <Tabs
        value={filters.read ?? ''}
        onChange={(read) => update({ read })}
        items={[
          { id: '', label: 'All', count: list.data?.counts?.all },
          { id: 'unread', label: 'Unread', count: list.data?.counts?.unread },
          { id: 'read', label: 'Read' },
        ]}
        label="Read status"
      />
      <FilterBar className="md:grid-cols-3">
        <FormField id="nt-type" label="Type">
          <Select id="nt-type" value={filters.type ?? ''} onChange={(type) => update({ type })} options={[{ value: '', label: 'All types' }, ...(types.data ?? []).map((item) => ({ value: item.type, label: item.label }))]} />
        </FormField>
        <FormField id="nt-from" label="From">
          <DateInput id="nt-from" value={filters.from ?? ''} onChange={(from) => update({ from })} />
        </FormField>
        <FormField id="nt-to" label="To">
          <DateInput id="nt-to" value={filters.to ?? ''} onChange={(to) => update({ to })} />
        </FormField>
      </FilterBar>
      <ResultCount count={list.data?.meta?.total ?? 0} noun="notifications" />
      {list.isLoading ? <Skeleton className="h-64" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? <EmptyState title="No notifications here" description="New applications, interview reminders and exports appear here." /> : null}
      {rows.length ? (
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {rows.map((item) => (
              <li key={item.id}>
                <NotificationItem item={item} onSelect={bell.open} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Pagination total={list.data?.meta?.total} page={Number(filters.page) || 1} pageCount={list.data?.meta?.last_page ?? 1} perPage={20} perPageOptions={[20]} onPageChange={(page) => update({ page: String(page) })} onPerPageChange={() => {}} />
    </div>
  )
}

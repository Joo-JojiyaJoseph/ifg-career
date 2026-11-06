import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { client } from '@shared/api/createClient'
import { compact } from '@shared/api/params'
import { Badge } from '@shared/ui/Badge'
import { Card, PageHeader } from '@shared/ui/Card'
import { DateInput } from '@shared/ui/DateInput'
import { ErrorState } from '@shared/ui/ErrorState'
import { FilterBar } from '@shared/ui/FilterBar'
import { FormField } from '@shared/ui/FormField'
import { Pagination } from '@shared/ui/Pagination'
import { ResultCount } from '@shared/ui/ResultCount'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { formatDateTime } from '@shared/lib/formatDate'

const fetchAudit = async (params) => (await client.get('/api/v1/hr/audit-logs', { params: compact(params) })).data
const tone = (action) => (action.includes('deleted') || action.includes('blacklist') ? 'red-soft' : action.includes('created') ? 'green' : action.includes('export') ? 'amber' : 'blue')

export function AuditLogPage() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(params.entries())
  const list = useQuery({ queryKey: ['hr-audit', filters], queryFn: () => fetchAudit(filters), placeholderData: keepPreviousData })

  function update(patch) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  const rows = list.data?.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Audit Log" subtitle="Who changed what, and when. Changed values are not shown, only which fields changed." />
      <FilterBar className="md:grid-cols-3">
        <FormField id="au-action" label="Action">
          <Select id="au-action" value={filters.action ?? ''} onChange={(action) => update({ action })} options={[{ value: '', label: 'All actions' }, ...(list.data?.actions ?? []).map((action) => ({ value: action, label: action }))]} />
        </FormField>
        <FormField id="au-from" label="From"><DateInput id="au-from" value={filters.from ?? ''} onChange={(from) => update({ from })} /></FormField>
        <FormField id="au-to" label="To"><DateInput id="au-to" value={filters.to ?? ''} onChange={(to) => update({ to })} /></FormField>
      </FilterBar>
      <ResultCount count={list.data?.meta?.total ?? 0} noun="entries" />
      {list.isLoading ? <Skeleton className="h-64" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !rows.length ? <EmptyState title="No audit entries match these filters" /> : null}
      {rows.length ? (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-40 shrink-0 text-xs text-muted">{formatDateTime(row.created_at)}</span>
                <Badge color={tone(row.action)}>{row.action}</Badge>
                <span className="flex-1 text-sm text-text">
                  <span className="font-medium text-navy">{row.user}</span> · {row.subject}
                  {row.changes.length ? <span className="block text-xs text-muted">Changed: {row.changes.slice(0, 8).join(', ')}{row.changes.length > 8 ? '…' : ''}</span> : null}
                </span>
                <span className="text-xs text-muted">{row.ip}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Pagination page={Number(filters.page) || 1} pageCount={list.data?.meta?.last_page ?? 1} perPage={50} perPageOptions={[50]} onPageChange={(page) => update({ page: String(page) })} onPerPageChange={() => {}} />
    </div>
  )
}

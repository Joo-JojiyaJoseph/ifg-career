import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { client } from '@shared/api/createClient'
import { compact } from '@shared/api/params'
import { Button } from '@shared/ui/Button'
import { Card, PageHeader } from '@shared/ui/Card'
import { DateInput } from '@shared/ui/DateInput'
import { ErrorState } from '@shared/ui/ErrorState'
import { FilterBar } from '@shared/ui/FilterBar'
import { FormField } from '@shared/ui/FormField'
import { Select } from '@shared/ui/Select'
import { Skeleton } from '@shared/ui/Skeleton'
import { Tabs } from '@shared/ui/Tabs'
import { downloadCsv } from '@shared/lib/csv'
import { fetchEntities } from '../applications/api'

const fetchReports = async () => (await client.get('/api/v1/hr/reports')).data.data
const fetchReport = async (key, params) => (await client.get(`/api/v1/hr/reports/${key}`, { params: compact(params) })).data.data

export function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const report = params.get('report') || 'by-entity'
  const filters = { from: params.get('from') ?? '', to: params.get('to') ?? '', entity: params.get('entity') ?? '' }
  const list = useQuery({ queryKey: ['hr-reports'], queryFn: fetchReports, staleTime: Infinity })
  const entities = useQuery({ queryKey: ['public-entities'], queryFn: fetchEntities, staleTime: 600_000 })
  const data = useQuery({ queryKey: ['hr-report', report, filters], queryFn: () => fetchReport(report, filters), placeholderData: keepPreviousData })

  function update(patch) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    setParams(next, { replace: true })
  }

  const result = data.data
  const numeric = result?.columns.filter((column) => column.key !== 'name') ?? []
  const max = Math.max(1, ...(result?.rows ?? []).map((row) => Number(row[numeric[0]?.key]) || 0))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reports"
        subtitle="How hiring is going across the group."
        actions={result ? <Button variant="secondary" icon={ArrowDownTrayIcon} onClick={() => downloadCsv(`infolks-group-${report}.csv`, result.columns, result.rows)}>Download CSV</Button> : null}
      />
      <Tabs items={(list.data ?? []).map((item) => ({ id: item.key, label: item.title }))} value={report} onChange={(next) => update({ report: next })} label="Reports" />
      <FilterBar className="md:grid-cols-3">
        <FormField id="rp-from" label="Applied from"><DateInput id="rp-from" value={filters.from} onChange={(from) => update({ from })} /></FormField>
        <FormField id="rp-to" label="Applied to"><DateInput id="rp-to" value={filters.to} onChange={(to) => update({ to })} /></FormField>
        <FormField id="rp-entity" label="Entity">
          <Select id="rp-entity" value={filters.entity} onChange={(entity) => update({ entity })} options={[{ value: '', label: 'All entities' }, ...(entities.data ?? []).map((item) => ({ value: item.slug, label: item.name }))]} />
        </FormField>
      </FilterBar>
      {data.isLoading ? <Skeleton className="h-64" /> : null}
      {data.isError ? <ErrorState onRetry={() => data.refetch()} /> : null}
      {result ? (
        <Card className="overflow-x-auto">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy">{result.title}</h2>
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                {result.columns.map((column) => <th key={column.key} scope="col" className="py-2 pr-4 font-medium">{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.name} className="border-b border-border/60 last:border-0">
                  {result.columns.map((column, index) => (
                    <td key={column.key} className={`py-3 pr-4 ${index === 0 ? 'font-medium text-navy' : 'tabular-nums text-text'}`}>
                      {index === 1 && typeof row[column.key] === 'number' ? (
                        <span className="flex items-center gap-3">
                          <span className="w-10">{row[column.key].toLocaleString('en-IN')}</span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-brand-50"><span className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700" style={{ width: `${(row[column.key] / max) * 100}%` }} /></span>
                        </span>
                      ) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!result.rows.length ? <p className="py-6 text-center text-sm text-muted">No data for these filters.</p> : null}
        </Card>
      ) : null}
    </div>
  )
}

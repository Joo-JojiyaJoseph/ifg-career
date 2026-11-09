import { Suspense, useMemo, useState } from 'react'
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowDownTrayIcon, EnvelopeIcon, MegaphoneIcon, NewspaperIcon, UsersIcon } from '@heroicons/react/24/outline'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, PageHeader } from '@shared/ui/Card'
import { DataTable } from '@shared/ui/DataTable'
import { DateInput } from '@shared/ui/DateInput'
import { ErrorState } from '@shared/ui/ErrorState'
import { FilterBar } from '@shared/ui/FilterBar'
import { FormField } from '@shared/ui/FormField'
import { Modal } from '@shared/ui/Modal'
import { Pagination } from '@shared/ui/Pagination'
import { ProgressBar } from '@shared/ui/ProgressBar'
import { ResultCount } from '@shared/ui/ResultCount'
import { FilterPanel } from '@shared/ui/FilterPanel'
import { FilterToolbar, QuickFilter } from '@shared/ui/FilterToolbar'
import { SearchInput } from '@shared/ui/SearchInput'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { Tabs } from '@shared/ui/Tabs'
import { useToast } from '@shared/ui/Toast'
import { AnimatedNumber } from '@shared/ui/Motion'
import { formatDate, formatDateTime } from '@shared/lib/formatDate'
import { useAuth } from '../auth/AuthProvider'
import { useQueuedExport } from '../exports/useQueuedExport'
import { fetchCampaign, fetchCampaigns, fetchMembers } from './api'

export function TalentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') || 'members'
  const canSend = user?.permissions?.includes('campaigns.send')

  function update(patch) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => (value !== '' && value != null ? next.set(key, String(value)) : next.delete(key)))
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Talent Community"
        subtitle="People who want to hear about new roles at Infolks Group."
        actions={canSend ? (
          <>
            <Button icon={MegaphoneIcon} onClick={() => navigate('/talent/new?type=job_alert')}>Send job alert</Button>
            <Button variant="secondary" icon={NewspaperIcon} onClick={() => navigate('/talent/new?type=company_update')}>Company update</Button>
          </>
        ) : null}
      />
      <Tabs
        value={view}
        onChange={(next) => update({ view: next === 'members' ? '' : next, page: '' })}
        items={[{ id: 'members', label: 'Members', icon: UsersIcon }, { id: 'campaigns', label: 'Campaigns', icon: EnvelopeIcon }]}
        label="Talent community views"
      />
      {view === 'members' ? <MembersView params={params} update={update} /> : <CampaignsView params={params} update={update} />}
      {/* The campaign composer opens here as a modal (child route /talent/new). */}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </div>
  )
}

const memberFilterKeys = ['subscribed', 'source', 'linked', 'joined_from', 'joined_to']

function MembersView({ params, update }) {
  const toast = useToast()
  const { user } = useAuth()
  const filters = Object.fromEntries(params.entries())
  const query = { ...filters, view: undefined, page: Number(filters.page) || 1, per_page: Number(filters.per_page) || 25 }
  const list = useQuery({ queryKey: ['hr-talent', 'members', query], queryFn: () => fetchMembers(query), placeholderData: keepPreviousData })
  const exporter = useQueuedExport('talent_members')
  const counts = list.data?.counts ?? {}
  const rows = list.data?.data ?? []
  const columns = useMemo(() => memberColumns(), [])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeCount = memberFilterKeys.filter((key) => filters[key]).length

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Subscribed" value={counts.subscribed ?? 0} tone="text-success" />
        <Stat label="Unsubscribed" value={counts.unsubscribed ?? 0} tone="text-muted" />
        <Stat label="Joined via sign-up form" value={counts.source?.signup_form ?? 0} tone="text-brand-700" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <FilterToolbar
            search={<SearchInput id="talent-search" value={filters.q ?? ''} onChange={(q) => update({ q })} placeholder="Search name, email or phone" label="Search members" />}
            quick={<QuickFilter id="quick-subscribed" label="Subscription" value={filters.subscribed ?? ''} onChange={(subscribed) => update({ subscribed })} options={[{ value: '', label: 'Everyone' }, { value: '1', label: 'Subscribed' }, { value: '0', label: 'Unsubscribed' }]} />}
            activeCount={activeCount}
            onOpen={() => setFiltersOpen(true)}
          />
        </div>
        {user?.permissions?.includes('talent.export') ? (
          <Button variant="secondary" icon={ArrowDownTrayIcon} onClick={() => exporter.start(query).catch((error) => toast.push({ tone: 'error', message: error.message }))}>Export</Button>
        ) : null}
      </div>
      <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} activeCount={activeCount} onClear={() => update(Object.fromEntries(memberFilterKeys.map((key) => [key, ''])))}>
      <FilterBar>
        <FormField id="tm-subscribed" label="Subscription">
          <Select id="tm-subscribed" value={filters.subscribed ?? ''} onChange={(subscribed) => update({ subscribed })} options={[{ value: '', label: 'Everyone' }, { value: '1', label: 'Subscribed' }, { value: '0', label: 'Unsubscribed' }]} />
        </FormField>
        <FormField id="tm-source" label="Joined through">
          <Select id="tm-source" value={filters.source ?? ''} onChange={(source) => update({ source })} options={[{ value: '', label: 'Any' }, { value: 'signin', label: 'Google sign-in' }, { value: 'signup_form', label: 'Sign-up form' }, { value: 'quick_apply', label: 'Quick apply' }]} />
        </FormField>
        <FormField id="tm-linked" label="Candidate profile">
          <Select id="tm-linked" value={filters.linked ?? ''} onChange={(linked) => update({ linked })} options={[{ value: '', label: 'Any' }, { value: '1', label: 'Has a profile' }, { value: '0', label: 'No profile' }]} />
        </FormField>
        <FormField id="tm-from" label="Joined from">
          <DateInput id="tm-from" value={filters.joined_from ?? ''} onChange={(joined_from) => update({ joined_from })} />
        </FormField>
        <FormField id="tm-to" label="Joined to">
          <DateInput id="tm-to" value={filters.joined_to ?? ''} onChange={(joined_to) => update({ joined_to })} />
        </FormField>
      </FilterBar>
      </FilterPanel>
      <ResultCount count={list.data?.meta?.total ?? 0} noun="members" />
      {list.isLoading ? <Skeleton className="h-64" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? <EmptyState title="No members match these filters" /> : null}
      {rows.length ? (
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => String(row.id)}
          sorting={[{ id: filters.sort || 'subscribed_at', desc: filters.direction !== 'asc' }]}
          onSortingChange={(next) => update(next[0] ? { sort: next[0].id, direction: next[0].desc ? 'desc' : 'asc' } : { sort: '', direction: '' })}
          renderCard={(member) => (
            <div>
              <p className="font-medium text-navy">{member.name}</p>
              <p className="text-sm text-muted">{member.email}</p>
              <div className="mt-2 flex gap-2">
                <Badge color={member.is_subscribed ? 'green' : 'slate'}>{member.is_subscribed ? 'Subscribed' : 'Unsubscribed'}</Badge>
                <Badge color={member.source?.color}>{member.source?.label}</Badge>
              </div>
            </div>
          )}
        />
      ) : null}
      <Pagination page={query.page} pageCount={list.data?.meta?.last_page ?? 1} perPage={query.per_page} onPageChange={(page) => update({ page })} onPerPageChange={(per_page) => update({ per_page })} />
    </>
  )
}

function CampaignsView({ params, update }) {
  const filters = Object.fromEntries(params.entries())
  const [openId, setOpenId] = useState(filters.campaign ?? null)
  const list = useQuery({
    queryKey: ['hr-talent', 'campaigns', filters.type, filters.status, filters.page],
    queryFn: () => fetchCampaigns({ type: filters.type, status: filters.status, page: filters.page }),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (query.state.data?.data?.some((item) => item.status.value === 'sending') ? 3000 : false),
  })
  const rows = list.data?.data ?? []

  return (
    <>
      <FilterBar className="md:grid-cols-3">
        <FormField id="cp-type" label="Type">
          <Select id="cp-type" value={filters.type ?? ''} onChange={(type) => update({ type })} options={[{ value: '', label: 'All types' }, { value: 'job_alert', label: 'Job alerts' }, { value: 'company_update', label: 'Company updates' }]} />
        </FormField>
        <FormField id="cp-status" label="Status">
          <Select id="cp-status" value={filters.status ?? ''} onChange={(status) => update({ status })} options={[{ value: '', label: 'Any status' }, { value: 'draft', label: 'Draft' }, { value: 'sending', label: 'Sending' }, { value: 'sent', label: 'Sent' }, { value: 'failed', label: 'Failed' }]} />
        </FormField>
      </FilterBar>
      <ResultCount count={list.data?.meta?.total ?? 0} noun="campaigns" />
      {list.isLoading ? <Skeleton className="h-48" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? <EmptyState title="No campaigns yet" description="Send a job alert to let members know about new roles." /> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((campaign) => (
          <Card key={campaign.public_id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-navy">{campaign.subject}</p>
                <p className="text-sm text-muted">{campaign.type.label} · {campaign.sent_by ?? '—'} · {formatDate(campaign.started_at ?? campaign.created_at)}</p>
              </div>
              <Badge color={campaign.status.color}>{campaign.status.label}</Badge>
            </div>
            {campaign.status.value === 'sending' ? <ProgressBar value={campaign.progress} label="Sending" /> : null}
            {campaign.status.value !== 'draft' ? (
              <p className="text-sm text-text">{campaign.sent_count} of {campaign.recipient_count} sent{campaign.failed_count ? ` · ${campaign.failed_count} failed` : ''}</p>
            ) : null}
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setOpenId(campaign.public_id)}>Details</Button>
              {campaign.status.value === 'draft' ? <Link className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-brand-700 underline" to={`/talent/new?draft=${campaign.public_id}`}>Continue draft</Link> : null}
            </div>
          </Card>
        ))}
      </div>
      <Pagination page={Number(filters.page) || 1} pageCount={list.data?.meta?.last_page ?? 1} perPage={20} perPageOptions={[20]} onPageChange={(page) => update({ page })} onPerPageChange={() => {}} />
      <CampaignDetail id={openId} onClose={() => { setOpenId(null); update({ campaign: '' }) }} />
    </>
  )
}

function CampaignDetail({ id, onClose }) {
  const detail = useQuery({ queryKey: ['hr-talent', 'campaign', id], queryFn: () => fetchCampaign(id), enabled: Boolean(id) })
  const campaign = detail.data

  return (
    <Modal open={Boolean(id)} onClose={onClose} title={campaign?.subject ?? 'Campaign'}>
      {detail.isLoading ? <Skeleton className="h-32" /> : null}
      {campaign ? (
        <dl className="grid gap-3 text-sm">
          <Row label="Type">{campaign.type.label}</Row>
          <Row label="Status"><Badge color={campaign.status.color}>{campaign.status.label}</Badge></Row>
          <Row label="Recipients">{campaign.recipient_count}</Row>
          <Row label="Sent">{campaign.sent_count}</Row>
          <Row label="Failed">{campaign.failed_count}</Row>
          <Row label="Started">{formatDateTime(campaign.started_at)}</Row>
          <Row label="Finished">{formatDateTime(campaign.finished_at)}</Row>
          {campaign.jobs?.length ? <Row label="Jobs">{campaign.jobs.map((job) => job.title).join(', ')}</Row> : null}
        </dl>
      ) : null}
    </Modal>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-text">{children}</dd>
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${tone}`}><AnimatedNumber value={value} /></p>
    </Card>
  )
}

function memberColumns() {
  return [
    { id: 'name', header: 'Name', cell: ({ row }) => row.original.candidate ? <Link className="font-medium text-brand-700 hover:underline" to={`/candidates/${row.original.candidate.public_id}`}>{row.original.name}</Link> : <span className="font-medium text-navy">{row.original.name}</span> },
    { id: 'email', header: 'Email', enableSorting: false, cell: ({ row }) => row.original.email },
    { id: 'phone', header: 'Phone', enableSorting: false, cell: ({ row }) => row.original.phone || '—' },
    { id: 'source', header: 'Joined through', enableSorting: false, cell: ({ row }) => <Badge color={row.original.source?.color}>{row.original.source?.label}</Badge> },
    { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => <Badge color={row.original.is_subscribed ? 'green' : 'slate'}>{row.original.is_subscribed ? 'Subscribed' : 'Unsubscribed'}</Badge> },
    { id: 'subscribed_at', header: 'Joined', cell: ({ row }) => formatDate(row.original.subscribed_at) },
  ]
}

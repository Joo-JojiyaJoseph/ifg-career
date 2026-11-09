import PropTypes from 'prop-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { formatDateTime } from '@shared/lib/formatDate'
import { fetchHealth, retryJob, testIntegration } from './api'

export function SystemPanel() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const health = useQuery({ queryKey: ['hr-health'], queryFn: fetchHealth, refetchInterval: 30_000 })
  const test = useMutation({ mutationFn: testIntegration, onSuccess: (data) => toast.push({ tone: 'success', message: data.message }), onError: (error) => toast.push({ tone: 'error', message: error.message }) })
  const retry = useMutation({ mutationFn: retryJob, onSuccess: (data) => { toast.push({ tone: 'success', message: data.message }); queryClient.invalidateQueries({ queryKey: ['hr-health'] }) }, onError: (error) => toast.push({ tone: 'error', message: error.message }) })

  if (health.isLoading) return <Skeleton className="h-96" />
  if (health.isError) return <ErrorState onRetry={() => health.refetch()} />
  const data = health.data

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="font-display text-lg font-semibold text-navy">Integrations</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {data.integrations.map((item) => (
            <li key={item.key} className="flex flex-wrap items-center gap-3">
              {item.configured ? <CheckCircleIcon className="h-5 w-5 text-success" aria-hidden="true" /> : <ExclamationTriangleIcon className="h-5 w-5 text-warning" aria-hidden="true" />}
              <span className="flex-1 text-sm text-text">{item.name}<span className="block text-xs text-muted">{item.configured ? 'Configured' : 'Not configured: see the README'}</span></span>
              {item.testable ? <Button size="sm" variant="secondary" loading={test.isPending && test.variables === item.key} onClick={() => test.mutate(item.key)}>Test</Button> : null}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-display text-lg font-semibold text-navy">Background jobs</h2>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-brand-50 p-3"><dt className="text-xs text-muted">Driver</dt><dd className="font-semibold text-navy">{data.queue.driver}</dd></div>
          <div className="rounded-xl bg-brand-50 p-3"><dt className="text-xs text-muted">Waiting</dt><dd className="font-semibold text-navy">{data.queue.pending ?? '—'}</dd></div>
          <div className={`rounded-xl p-3 ${data.queue.failed ? 'bg-red-50' : 'bg-brand-50'}`}><dt className="text-xs text-muted">Failed</dt><dd className={`font-semibold ${data.queue.failed ? 'text-danger' : 'text-navy'}`}>{data.queue.failed}</dd></div>
        </dl>
        {data.queue.pending > 50 ? <p className="mt-3 text-sm text-warning">Many jobs are waiting. Check that the queue worker is running (see the README).</p> : null}
        <ul className="mt-4 divide-y divide-border">
          {data.failed_jobs.map((job) => (
            <li key={job.uuid} className="flex items-center gap-3 py-2 text-sm">
              <span className="min-w-0 flex-1"><span className="font-medium text-navy">{job.job}</span><span className="block truncate text-xs text-muted">{formatDateTime(job.failed_at)} · {job.error}</span></span>
              <Button size="sm" variant="ghost" icon={ArrowPathIcon} loading={retry.isPending && retry.variables === job.uuid} onClick={() => retry.mutate(job.uuid)}>Retry</Button>
            </li>
          ))}
        </ul>
        {data.uploads ? <UploadSettings uploads={data.uploads} /> : null}
        <p className="mt-4 text-xs text-muted">Laravel {data.app.laravel} · PHP {data.app.php} · {data.app.environment}{data.app.debug ? ' · debug on' : ''}</p>
      </Card>
    </div>
  )
}

/** PHP's upload settings: when uploads fail, this says which php.ini setting to change. */
function UploadSettings({ uploads }) {
  const rows = [
    ['Uploads allowed (file_uploads)', uploads.file_uploads ? 'On' : 'Off', uploads.file_uploads],
    ['Largest file (upload_max_filesize)', uploads.upload_max_filesize, uploads.ok || uploads.tmp_dir_writable],
    ['Largest request (post_max_size)', uploads.post_max_size, true],
    ['Temporary folder (upload_tmp_dir)', uploads.tmp_dir_writable ? uploads.tmp_dir : `${uploads.tmp_dir || 'not set'} (missing or not writable)`, uploads.tmp_dir_writable],
  ]
  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="flex items-center gap-2 font-medium text-navy">
        {uploads.ok ? <CheckCircleIcon className="h-5 w-5 text-success" aria-hidden="true" /> : <ExclamationTriangleIcon className="h-5 w-5 text-warning" aria-hidden="true" />}
        File uploads
      </h3>
      <dl className="mt-2 flex flex-col gap-1 text-sm">
        {rows.map(([label, value, good]) => (
          <div key={label} className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-muted">{label}</dt>
            <dd className={`break-all font-medium ${good ? 'text-navy' : 'text-danger'}`}>{value}</dd>
          </div>
        ))}
      </dl>
      {!uploads.ok ? <p className="mt-2 text-sm text-warning">Fix the settings in red in php.ini (5M or more for uploads, and a writable temporary folder), then restart PHP.</p> : null}
    </div>
  )
}

UploadSettings.propTypes = { uploads: PropTypes.object.isRequired }

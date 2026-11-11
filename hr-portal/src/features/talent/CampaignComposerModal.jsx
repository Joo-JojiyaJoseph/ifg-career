import { lazy, Suspense, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, MegaphoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { Modal } from '@shared/ui/Modal'
import { MultiSelect } from '@shared/ui/MultiSelect'
import { Skeleton } from '@shared/ui/Skeleton'
import { Tabs } from '@shared/ui/Tabs'
import { useToast } from '@shared/ui/Toast'
import { useUnsavedChanges } from '@shared/hooks/useUnsavedChanges'
import { fetchCampaign, fetchPublishedJobs, previewCampaign, saveCampaign, sendCampaign } from './api'

const RichTextEditor = lazy(() => import('@shared/ui/RichTextEditor'))

const steps = ['Write', 'Preview', 'Send']

/**
 * Write, preview and send a job alert or company update, in a modal over the Talent page (route /talent/new).
 * Write → Preview → Send; the step buttons stay pinned at the bottom.
 */
export function CampaignComposerModal() {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const draftId = params.get('draft')
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ type: params.get('type') === 'company_update' ? 'company_update' : 'job_alert', subject: '', body: '', jobs: [] })
  const [errors, setErrors] = useState({})
  const [campaignId, setCampaignId] = useState(draftId)
  const [preview, setPreview] = useState(null)
  const [device, setDevice] = useState('desktop')
  const [confirming, setConfirming] = useState(false)
  const [loadedDraft, setLoadedDraft] = useState(null)
  const [open, setOpen] = useState(true)

  const jobs = useQuery({ queryKey: ['hr-published-jobs'], queryFn: fetchPublishedJobs, staleTime: 60_000 })
  const draft = useQuery({ queryKey: ['hr-talent', 'campaign', draftId], queryFn: () => fetchCampaign(draftId), enabled: Boolean(draftId) })

  if (draft.data && loadedDraft !== draft.data.public_id) {
    setLoadedDraft(draft.data.public_id)
    setForm({ type: draft.data.type.value, subject: draft.data.subject, body: draft.data.body ?? '', jobs: draft.data.jobs?.map((job) => job.public_id) ?? [] })
  }

  const dirty = step < 2 && Boolean(form.subject || form.body || form.jobs.length)
  const leaveDialog = useUnsavedChanges(dirty && !confirming)

  const payload = { type: form.type, subject: form.subject, body: form.body || null, jobs: form.type === 'job_alert' ? form.jobs : [] }

  const previewMutation = useMutation({
    mutationFn: async () => {
      const saved = await saveCampaign(payload, campaignId)
      setCampaignId(saved.public_id)
      return previewCampaign(payload)
    },
    onSuccess: (data) => {
      setPreview(data)
      setErrors({})
      setStep(1)
    },
    onError: (error) => {
      setErrors(Object.fromEntries(Object.entries(error.errors ?? {}).map(([key, value]) => [key.split('.')[0], Array.isArray(value) ? value[0] : value])))
      toast.push({ tone: 'error', message: error.message })
    },
  })

  const sendMutation = useMutation({
    mutationFn: () => sendCampaign(campaignId),
    onSuccess: (campaign) => {
      setConfirming(false)
      toast.push({ tone: 'success', message: `Sending to ${campaign.recipient_count} members. We'll notify you when it finishes.` })
      queryClient.invalidateQueries({ queryKey: ['hr-talent'] })
      setOpen(false)
      setTimeout(() => navigate(`/talent?view=campaigns&campaign=${campaign.public_id}`), 200)
    },
    onError: (error) => {
      setConfirming(false)
      toast.push({ tone: 'error', message: error.message })
    },
  })

  function validate() {
    const next = {}
    if (!form.subject.trim()) next.subject = 'Add a subject line.'
    if (form.type === 'job_alert' && form.jobs.length === 0) next.jobs = 'Choose at least one job.'
    if (form.type === 'company_update' && !form.body.trim()) next.body = 'Write the update.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const jobOptions = (jobs.data ?? []).map((job) => ({ value: job.public_id, label: `${job.title} · ${job.entity?.name ?? ''}` }))

  function close() {
    setOpen(false)
    setTimeout(() => navigate('/talent?view=campaigns'), 200)
  }

  const footer =
    step === 0 ? (
      <>
        <Button variant="secondary" onClick={close}>Cancel</Button>
        <Button iconRight={ArrowRightIcon} loading={previewMutation.isPending} onClick={() => validate() && previewMutation.mutate()}>Preview</Button>
      </>
    ) : step === 1 ? (
      <>
        <Button variant="ghost" icon={ArrowLeftIcon} className="sm:mr-auto" onClick={() => setStep(0)}>Edit</Button>
        <Button iconRight={ArrowRightIcon} onClick={() => setStep(2)}>Continue</Button>
      </>
    ) : (
      <>
        <Button variant="ghost" icon={ArrowLeftIcon} className="sm:mr-auto" onClick={() => setStep(1)}>Back</Button>
        <Button icon={PaperAirplaneIcon} disabled={!preview?.recipient_count} onClick={() => setConfirming(true)}>Send now</Button>
      </>
    )

  return (
    <>
      <Modal
        open={open}
        onClose={close}
        size="xl"
        icon={MegaphoneIcon}
        title={form.type === 'job_alert' ? 'New job alert' : 'New company update'}
        description="Only subscribed talent community members receive it. Every email includes an unsubscribe link."
        footer={footer}
      >
        <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Steps">
          {steps.map((label, index) => (
            <li key={label} className="flex flex-col gap-2" aria-current={index === step ? 'step' : undefined}>
              <span className={`h-1.5 rounded-full transition-colors duration-200 ${index <= step ? 'bg-brand-600' : 'bg-brand-100'}`} aria-hidden="true" />
              <span className={`flex items-center gap-1.5 text-sm font-medium ${index === step ? 'text-brand-700' : index < step ? 'text-success' : 'text-muted'}`}>
                {index < step ? <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> : <span className="tabular-nums">{index + 1}.</span>}
                {label}
              </span>
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <div className="flex flex-col gap-5">
            <Tabs
              value={form.type}
              onChange={(type) => setForm((current) => ({ ...current, type }))}
              items={[{ id: 'job_alert', label: 'Job alert' }, { id: 'company_update', label: 'Company update' }]}
              label="Campaign type"
            />
            <FormField id="cp-subject" label="Subject line" required error={errors.subject}>
              <Input id="cp-subject" value={form.subject} maxLength={200} invalid={Boolean(errors.subject)} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder={form.type === 'job_alert' ? 'New roles at Infolks Group this week' : 'News from Infolks Group'} />
            </FormField>
            {form.type === 'job_alert' ? (
              <FormField id="cp-jobs" label="Jobs to include" required error={errors.jobs} hint="Published jobs that are still open. Links in the email are tracked as job alert applications.">
                {jobs.isLoading ? <Skeleton className="h-11" /> : (
                  <MultiSelect id="cp-jobs" value={form.jobs} invalid={Boolean(errors.jobs)} onChange={(selected) => setForm((current) => ({ ...current, jobs: selected }))} options={jobOptions} placeholder="Search published jobs" noun="job" />
                )}
              </FormField>
            ) : null}
            <FormField id="cp-body" label={form.type === 'job_alert' ? 'Intro (optional)' : 'Message'} required={form.type === 'company_update'} error={errors.body}>
              <Suspense fallback={<Skeleton className="h-48" />}>
                <RichTextEditor id="cp-body" value={form.body} invalid={Boolean(errors.body)} onChange={(body) => setForm((current) => ({ ...current, body }))} />
              </Suspense>
            </FormField>
          </div>
        ) : null}

        {step === 1 && preview ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text"><span className="font-medium">Subject:</span> {preview.subject}</p>
              <Tabs value={device} onChange={setDevice} items={[{ id: 'desktop', label: 'Desktop' }, { id: 'mobile', label: 'Mobile' }]} label="Preview size" />
            </div>
            <div className="flex justify-center rounded-2xl bg-slate-100 p-4">
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={preview.html}
                className={`h-[32rem] rounded-xl border border-border bg-white shadow-card transition-all duration-300 ${device === 'mobile' ? 'w-[375px] max-w-full' : 'w-full max-w-[680px]'}`}
              />
            </div>
          </div>
        ) : null}

        {step === 2 && preview ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <PaperAirplaneIcon className="h-8 w-8" aria-hidden="true" />
            </span>
            <p className="font-display text-2xl font-semibold text-navy">Ready to send to {preview.recipient_count} members</p>
            <p className="max-w-md text-sm text-muted">Emails go out in batches. Unsubscribed people are skipped automatically. You can close this window; you'll get a notification when sending finishes.</p>
          </div>
        ) : null}

        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={() => sendMutation.mutate()}
          loading={sendMutation.isPending}
          tone="primary"
          title="Send this campaign?"
          message={`"${form.subject}" will be emailed to ${preview?.recipient_count ?? 0} subscribed members. This cannot be undone.`}
          confirmLabel="Send"
        />
      </Modal>
      {leaveDialog}
    </>
  )
}

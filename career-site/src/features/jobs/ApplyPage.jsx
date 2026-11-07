import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { client, ensureCsrf } from '@shared/api/createClient'
import { applyApiErrors, focusFirstError, toFormData } from '@shared/lib/formErrors'
import { useUnsavedChanges } from '@shared/hooks/useUnsavedChanges'
import { jobApplySchema, GENDER_OPTIONS } from '@shared/validation/candidate'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { Checkbox, Input } from '@shared/ui/Input'
import { ErrorState } from '@shared/ui/ErrorState'
import { FileUpload } from '@shared/ui/FileUpload'
import { FormField } from '@shared/ui/FormField'
import { PhoneInput } from '@shared/ui/PhoneInput'
import { Select } from '@shared/ui/Select'
import { Skeleton } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { useCandidateAuth } from '../auth/AuthProvider'
import { startGoogleSignIn } from '../auth/api'
import { fetchPublicJob, publicIdFromParam } from './api'


export function ApplyPage() {
  const { jobRef } = useParams()
  const [params] = useSearchParams()
  const publicId = publicIdFromParam(jobRef)
  const { candidate, loading } = useCandidateAuth()
  const jobQuery = useQuery({
    queryKey: ['public-job', publicId, null],
    queryFn: () => fetchPublicJob(publicId),
    enabled: Boolean(publicId),
  })

  if (loading || jobQuery.isLoading) {
    return <div className="mx-auto max-w-xl px-4 py-10"><Skeleton className="h-40" /></div>
  }
  if (!publicId || jobQuery.isError) {
    return <div className="mx-auto max-w-xl px-4 py-10"><ErrorState title="This role is not open for applications" /></div>
  }
  if (!candidate) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
        <h1 className="font-display text-3xl text-navy">Sign in to apply</h1>
        <Button onClick={() => startGoogleSignIn(`/jobs/${publicId}/apply${params.get('src') ? `?src=${params.get('src')}` : ''}`)}>Sign in with Google</Button>
      </div>
    )
  }

  const job = jobQuery.data
  if (job?.eligibility && job.eligibility.eligible === false) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-display text-3xl text-navy">{job.title}</h1>
        <p className="mt-3 text-navy" role="status">{job.eligibility.message}</p>
        <Link className="mt-6 inline-flex min-h-11 items-center text-brand-700" to={job.path}>Back to the role</Link>
      </div>
    )
  }

  return <ApplyForm job={job} candidate={candidate} src={params.get('src') || ''} />
}

function ApplyForm({ job, candidate, src }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const schema = useMemo(() => jobApplySchema(Boolean(candidate.has_resume)), [candidate.has_resume])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: candidate.name || '',
      phone: candidate.phone || '',
      location: candidate.location || '',
      gender: candidate.gender || '',
      years_experience: candidate.years_experience ?? '',
      current_ctc: candidate.current_ctc ?? '',
      expected_ctc: candidate.expected_ctc ?? '',
      reference_id: '',
      resume: null,
      linkedin_url: candidate.linkedin_url || '',
      portfolio_url: candidate.portfolio_url || '',
      save_to_profile: false,
    },
  })
  useUnsavedChanges(form.formState.isDirty && !submitted)

  const mutation = useMutation({
    mutationFn: async (values) => {
      const body = toFormData({ ...values, src }, values.resume)
      await ensureCsrf()
      const { data } = await client.post(`/api/v1/candidate/jobs/${job.public_id}/apply`, body)
      return data
    },
    onSuccess: (data) => {
      setSubmitted(true)
      toast.push({ tone: 'success', message: data.message })
      navigate(`/jobs/${job.public_id}/apply/received`, {
        state: { message: data.message, role: job.title, entity: job.entity?.name },
      })
    },
    onError: (error) => applyApiErrors(error, form.setError),
  })

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <h1 className="font-display text-3xl text-navy">Apply for {job.title}</h1>
        <p className="mt-1 text-sm text-muted">{job.entity?.name}</p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values), focusFirstError)} noValidate>
          {mutation.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger" role="alert">{mutation.error.message}</p> : null}
          <FormField id="name" label="Name" required error={form.formState.errors.name?.message}>
            <Input id="name" invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
          </FormField>
          <FormField id="email" label="Email">
            <Input id="email" value={candidate.email} readOnly />
          </FormField>
          <FormField id="phone" label="Phone" required error={form.formState.errors.phone?.message}>
            {({ describedBy }) => (
              <Controller control={form.control} name="phone" render={({ field }) => (
                <PhoneInput id="phone" value={field.value} onChange={field.onChange} invalid={Boolean(form.formState.errors.phone)} describedBy={describedBy} />
              )} />
            )}
          </FormField>
          <FormField id="location" label="Location" required error={form.formState.errors.location?.message}>
            <Input id="location" placeholder="City, Country" invalid={Boolean(form.formState.errors.location)} {...form.register('location')} />
          </FormField>
          <FormField id="gender" label="Gender" required error={form.formState.errors.gender?.message}>
            {({ describedBy }) => (
              <Controller control={form.control} name="gender" render={({ field }) => (
                <Select id="gender" value={field.value} onChange={field.onChange} options={GENDER_OPTIONS} placeholder="Choose" invalid={Boolean(form.formState.errors.gender)} describedBy={describedBy} />
              )} />
            )}
          </FormField>
          <FormField id="years_experience" label="Years of experience" required error={form.formState.errors.years_experience?.message}>
            <Input id="years_experience" type="number" min="0" step="0.1" invalid={Boolean(form.formState.errors.years_experience)} {...form.register('years_experience', { valueAsNumber: true })} />
          </FormField>
          <FormField id="current_ctc" label="Current CTC" required error={form.formState.errors.current_ctc?.message}>
            <Input id="current_ctc" type="number" min="0" step="1" invalid={Boolean(form.formState.errors.current_ctc)} {...form.register('current_ctc', { valueAsNumber: true })} />
          </FormField>
          <FormField id="expected_ctc" label="Expected CTC" required error={form.formState.errors.expected_ctc?.message}>
            <Input id="expected_ctc" type="number" min="0" step="1" invalid={Boolean(form.formState.errors.expected_ctc)} {...form.register('expected_ctc', { valueAsNumber: true })} />
          </FormField>
          <FormField id="reference_id" label="Reference ID" error={form.formState.errors.reference_id?.message}>
            <Input id="reference_id" {...form.register('reference_id')} />
          </FormField>
          <FormField id="resume" label="Resume" required={!candidate.has_resume} error={form.formState.errors.resume?.message}>
            {({ describedBy }) => (
              <Controller control={form.control} name="resume" render={({ field }) => (
                <FileUpload id="resume" file={field.value} existingName={candidate.resume_original_name} onChange={field.onChange} invalid={Boolean(form.formState.errors.resume)} describedBy={describedBy} />
              )} />
            )}
          </FormField>
          <FormField id="linkedin_url" label="LinkedIn URL" error={form.formState.errors.linkedin_url?.message}>
            <Input id="linkedin_url" type="url" placeholder="https://" invalid={Boolean(form.formState.errors.linkedin_url)} {...form.register('linkedin_url')} />
          </FormField>
          <FormField id="portfolio_url" label="Portfolio URL" error={form.formState.errors.portfolio_url?.message}>
            <Input id="portfolio_url" type="url" placeholder="https://" invalid={Boolean(form.formState.errors.portfolio_url)} {...form.register('portfolio_url')} />
          </FormField>
          <Checkbox label="Save these changes to my profile" {...form.register('save_to_profile')} />
          <Button type="submit" className="w-full" loading={mutation.isPending}>Submit application</Button>
        </form>
      </Card>
    </div>
  )
}

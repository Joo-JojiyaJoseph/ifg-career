import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiUrl, client, ensureCsrf } from '@shared/api/createClient'
import { applyApiErrors, focusFirstError, toFormData } from '@shared/lib/formErrors'
import { profileSchema, GENDER_OPTIONS } from '@shared/validation/candidate'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { FileUpload } from '@shared/ui/FileUpload'
import { FormField } from '@shared/ui/FormField'
import { DateInput } from '@shared/ui/DateInput'
import { todayIso } from '@shared/lib/formatDate'
import { Input } from '@shared/ui/Input'
import { PhoneInput } from '@shared/ui/PhoneInput'
import { ProgressBar } from '@shared/ui/ProgressBar'
import { Select } from '@shared/ui/Select'
import { EmptyState } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { useCandidateAuth } from '../features/auth/AuthProvider'
import { fetchPublicMeta } from '../features/jobs/api'



export function ProfilePage() {
  const { candidate, loading } = useCandidateAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const meta = useQuery({ queryKey: ['public-meta'], queryFn: fetchPublicMeta, staleTime: 600_000, enabled: Boolean(candidate) })
  const form = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      name: candidate?.name || '',
      date_of_birth: candidate?.date_of_birth || '',
      phone: candidate?.phone || '',
      location: candidate?.location || '',
      gender: candidate?.gender || '',
      highest_qualification: candidate?.highest_qualification || '',
      preferred_department_id: candidate?.preferred_department_id ? String(candidate.preferred_department_id) : '',
      years_experience: candidate?.years_experience ?? '',
      current_ctc: candidate?.current_ctc ?? '',
      expected_ctc: candidate?.expected_ctc ?? '',
      linkedin_url: candidate?.linkedin_url || '',
      portfolio_url: candidate?.portfolio_url || '',
    },
  })
  const resumeForm = useForm({ defaultValues: { resume: null } })
  const resumeFile = useWatch({ control: resumeForm.control, name: 'resume' })

  useEffect(() => {
    document.title = 'Complete your profile · Infolks Group Careers'
  }, [])

  const save = useMutation({
    mutationFn: async (values) => {
      await ensureCsrf()
      const { data } = await client.put('/api/v1/candidate/profile', {
        ...values,
        preferred_department_id: Number(values.preferred_department_id),
        years_experience: values.years_experience,
        current_ctc: values.current_ctc,
        expected_ctc: values.expected_ctc,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', 'me'] })
      toast.push({ tone: 'success', message: 'Profile saved.' })
    },
    onError: (error) => {
      applyApiErrors(error, form.setError)
      toast.push({ tone: 'error', message: error.message })
    },
  })

  const upload = useMutation({
    mutationFn: async (file) => {
      await ensureCsrf()
      const { data } = await client.post('/api/v1/candidate/profile/resume', toFormData({}, file))
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', 'me'] })
      resumeForm.reset({ resume: null })
      toast.push({ tone: 'success', message: 'Resume updated.' })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  if (!loading && !candidate) {
    return <EmptyState title="Sign in to see your profile" description="Candidates sign in with Google. Your profile is created the first time you do." />
  }
  if (!candidate) return null

  const departments = (meta.data?.departments ?? []).map((department) => ({
    value: String(department.id),
    label: department.name,
  }))

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h1 className="font-display text-3xl text-navy">Complete your profile</h1>
        <div className="mt-4">
          <ProgressBar value={candidate.profile_completion_percent} />
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-medium text-navy">Resume</h2>
        <div className="mt-3">
          <FileUpload
            id="profile-resume"
            file={resumeFile}
            existingName={candidate.resume_original_name}
            onChange={(file) => resumeForm.setValue('resume', file)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button type="button" loading={upload.isPending} disabled={!resumeFile} onClick={() => upload.mutate(resumeForm.getValues('resume'))}>
            Replace resume
          </Button>
          {candidate.has_resume ? (
            <a className="inline-flex min-h-11 items-center text-brand-700" href={`${apiUrl}/api/v1/candidate/profile/resume`}>
              Preview resume
            </a>
          ) : null}
        </div>
      </Card>
      <Card>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((values) => save.mutate(values), focusFirstError)} noValidate>
          <FormField id="name" label="Name" required error={form.formState.errors.name?.message}>
            <Input id="name" invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
          </FormField>
          <FormField id="email" label="Email">
            <Input id="email" value={candidate.email} readOnly />
          </FormField>
          <FormField id="date_of_birth" label="Date of birth" required error={form.formState.errors.date_of_birth?.message}>
            {({ describedBy }) => (
              <Controller control={form.control} name="date_of_birth" render={({ field }) => (
                <DateInput id="date_of_birth" max={todayIso()} value={field.value} onChange={field.onChange} invalid={Boolean(form.formState.errors.date_of_birth)} describedBy={describedBy} />
              )} />
            )}
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
          <FormField id="highest_qualification" label="Highest qualification" required error={form.formState.errors.highest_qualification?.message}>
            <Input id="highest_qualification" invalid={Boolean(form.formState.errors.highest_qualification)} {...form.register('highest_qualification')} />
          </FormField>
          <FormField id="preferred_department_id" label="Preferred department" required error={form.formState.errors.preferred_department_id?.message}>
            {({ describedBy }) => (
              <Controller control={form.control} name="preferred_department_id" render={({ field }) => (
                <Select id="preferred_department_id" value={field.value} onChange={field.onChange} options={departments} placeholder="Choose a department" invalid={Boolean(form.formState.errors.preferred_department_id)} describedBy={describedBy} />
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
          <FormField id="linkedin_url" label="LinkedIn URL" error={form.formState.errors.linkedin_url?.message}>
            <Input id="linkedin_url" type="url" invalid={Boolean(form.formState.errors.linkedin_url)} {...form.register('linkedin_url')} />
          </FormField>
          <FormField id="portfolio_url" label="Portfolio URL" error={form.formState.errors.portfolio_url?.message}>
            <Input id="portfolio_url" type="url" invalid={Boolean(form.formState.errors.portfolio_url)} {...form.register('portfolio_url')} />
          </FormField>
          <Button type="submit" loading={save.isPending}>Save profile</Button>
        </form>
      </Card>
    </div>
  )
}

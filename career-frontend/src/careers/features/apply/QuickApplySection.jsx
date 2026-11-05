import { useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { client, ensureCsrf } from '@shared/api/createClient'
import { applyApiErrors, focusFirstError, toFormData } from '@shared/lib/formErrors'
import { TurnstileField } from '@shared/hooks/useTurnstile.jsx'
import { quickApplySchema, talentSignupSchema } from '@shared/validation/candidate'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { Checkbox } from '@shared/ui/Input'
import { DateInput } from '@shared/ui/DateInput'
import { FileUpload } from '@shared/ui/FileUpload'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { PhoneInput } from '@shared/ui/PhoneInput'
import { Select } from '@shared/ui/Select'
import { useToast } from '@shared/ui/Toast'
import { fetchPublicMeta } from '../jobs/api'

export function QuickApplySection() {
  return (
    <section id="quick-apply" className="bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <QuickApplyForm />
        <TalentSignupForm />
      </div>
    </section>
  )
}

function QuickApplyForm() {
  const toast = useToast()
  const getToken = useRef(async () => '')
  const rememberToken = useCallback((fn) => {
    getToken.current = fn
  }, [])
  const meta = useQuery({ queryKey: ['public-meta'], queryFn: fetchPublicMeta, staleTime: 600_000 })
  const form = useForm({
    resolver: zodResolver(quickApplySchema),
    defaultValues: {
      name: '',
      date_of_birth: '',
      email: '',
      phone: '',
      highest_qualification: '',
      location: '',
      department_id: '',
      resume: null,
      keep_updated: false,
      privacy_consent: false,
      company_website: '',
    },
  })
  const mutation = useMutation({
    mutationFn: async (values) => {
      const token = await getToken.current()
      const body = toFormData(values, values.resume)
      if (token) body.append('turnstile_token', token)
      const website = form.getValues('company_website')
      if (website) body.append('company_website', website)
      await ensureCsrf()
      const { data } = await client.post('/api/v1/public/quick-apply', body)
      return data
    },
    onSuccess: (data) => {
      toast.push({ tone: 'success', message: data.confirmation })
    },
    onError: (error) => applyApiErrors(error, form.setError),
  })

  if (mutation.data) {
    return (
      <Card>
        <div className="flex flex-col items-start gap-3">
          <CheckCircleIcon className="h-10 w-10 text-success" aria-hidden="true" />
          <h2 className="font-display text-2xl text-navy">Application received</h2>
          <p className="text-text">{mutation.data.confirmation}</p>
          {mutation.data.profile_notice ? <p className="text-sm text-brand-700">{mutation.data.profile_notice}</p> : null}
        </div>
      </Card>
    )
  }

  const departments = (meta.data?.departments ?? []).map((department) => ({
    value: String(department.id),
    label: department.name,
  }))

  return (
    <Card>
      <h2 className="font-display text-2xl text-navy">Quick apply</h2>
      <p className="mt-1 text-sm text-muted">Apply without choosing a role. Infolks Group will keep your details for the department you pick.</p>
      <form
        className="mt-6 grid grid-cols-1 gap-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values), focusFirstError)}
        noValidate
      >
        <Honeypot id="quick-company-website" register={form.register} />
        <TurnstileField onToken={rememberToken} />
        {mutation.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger" role="alert">{mutation.error.message}</p> : null}
        <FormField id="name" label="Full name" required error={form.formState.errors.name?.message}>
          <Input id="name" invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
        </FormField>
        <FormField id="date_of_birth" label="Date of birth" required error={form.formState.errors.date_of_birth?.message}>
          {({ describedBy }) => (
            <Controller
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <DateInput id="date_of_birth" value={field.value} onChange={field.onChange} invalid={Boolean(form.formState.errors.date_of_birth)} describedBy={describedBy} />
              )}
            />
          )}
        </FormField>
        <FormField id="email" label="Email ID" required error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
        </FormField>
        <FormField id="phone" label="Phone number" required error={form.formState.errors.phone?.message}>
          {({ describedBy }) => (
            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <PhoneInput id="phone" value={field.value} onChange={field.onChange} invalid={Boolean(form.formState.errors.phone)} describedBy={describedBy} />
              )}
            />
          )}
        </FormField>
        <FormField id="highest_qualification" label="Highest qualification" required error={form.formState.errors.highest_qualification?.message}>
          <Input id="highest_qualification" invalid={Boolean(form.formState.errors.highest_qualification)} {...form.register('highest_qualification')} />
        </FormField>
        <FormField id="location" label="Location" required error={form.formState.errors.location?.message}>
          <Input id="location" placeholder="City or town" invalid={Boolean(form.formState.errors.location)} {...form.register('location')} />
        </FormField>
        <FormField id="department_id" label="Department" required error={form.formState.errors.department_id?.message}>
          {({ describedBy }) => (
            <Controller
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <Select id="department_id" value={field.value} onChange={field.onChange} options={departments} placeholder="Choose a department" invalid={Boolean(form.formState.errors.department_id)} describedBy={describedBy} />
              )}
            />
          )}
        </FormField>
        <FormField id="resume" label="Resume" required error={form.formState.errors.resume?.message}>
          {({ describedBy }) => (
            <Controller
              control={form.control}
              name="resume"
              render={({ field }) => (
                <FileUpload id="resume" file={field.value} onChange={field.onChange} invalid={Boolean(form.formState.errors.resume)} describedBy={describedBy} />
              )}
            />
          )}
        </FormField>
        <Checkbox label="Keep me updated about new roles" {...form.register('keep_updated')} />
        <Checkbox
          label={<>I agree to the <Link className="text-brand-700 underline" to="/privacy">privacy policy</Link>.</>}
          {...form.register('privacy_consent')}
        />
        {form.formState.errors.privacy_consent ? <p className="text-sm text-danger" role="alert">{form.formState.errors.privacy_consent.message}</p> : null}
        <Button type="submit" className="w-full" loading={mutation.isPending}>Submit application</Button>
      </form>
    </Card>
  )
}

function TalentSignupForm() {
  const toast = useToast()
  const getToken = useRef(async () => '')
  const rememberToken = useCallback((fn) => {
    getToken.current = fn
  }, [])
  const form = useForm({
    resolver: zodResolver(talentSignupSchema),
    defaultValues: { name: '', email: '', phone: '', privacy_consent: false, company_website: '' },
  })
  const mutation = useMutation({
    mutationFn: async (values) => {
      const token = await getToken.current()
      await ensureCsrf()
      const { data } = await client.post('/api/v1/public/talent-community', {
        ...values,
        company_website: form.getValues('company_website') || '',
        turnstile_token: token,
      })
      return data
    },
    onSuccess: (data) => toast.push({ tone: 'success', message: data.message }),
    onError: (error) => applyApiErrors(error, form.setError, 'talent-'),
  })

  return (
    <Card>
      <h2 className="font-display text-xl text-navy">Join the talent community</h2>
      <p className="mt-1 text-sm text-muted">Hear about new openings at Infolks Group. No sign-in needed.</p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values), (errors) => focusFirstError(errors, 'talent-'))} noValidate>
        <Honeypot id="talent-company-website" register={form.register} />
        <TurnstileField onToken={rememberToken} />
        {mutation.data ? <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-navy" role="status">{mutation.data.message}</p> : null}
        {mutation.error ? <p className="text-sm text-danger" role="alert">{mutation.error.message}</p> : null}
        <FormField id="talent-name" label="Name" required error={form.formState.errors.name?.message}>
          <Input id="talent-name" invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
        </FormField>
        <FormField id="talent-email" label="Email" required error={form.formState.errors.email?.message}>
          <Input id="talent-email" type="email" invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
        </FormField>
        <FormField id="talent-phone" label="Phone" required error={form.formState.errors.phone?.message}>
          {({ describedBy }) => (
            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <PhoneInput id="talent-phone" value={field.value} onChange={field.onChange} invalid={Boolean(form.formState.errors.phone)} describedBy={describedBy} />
              )}
            />
          )}
        </FormField>
        <Checkbox
          label={<>I agree to the <Link className="text-brand-700 underline" to="/privacy">privacy policy</Link>.</>}
          {...form.register('privacy_consent')}
        />
        {form.formState.errors.privacy_consent ? <p className="text-sm text-danger" role="alert">{form.formState.errors.privacy_consent.message}</p> : null}
        <Button type="submit" className="w-full" loading={mutation.isPending}>Join</Button>
      </form>
    </Card>
  )
}

function Honeypot({ id, register }) {
  return (
    <div className="hidden" aria-hidden="true">
      <label htmlFor={id}>Company website</label>
      <input id={id} tabIndex={-1} autoComplete="off" {...register('company_website')} />
    </div>
  )
}

Honeypot.propTypes = {
  id: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
}

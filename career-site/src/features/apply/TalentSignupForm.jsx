import { useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { client, ensureCsrf } from '@shared/api/createClient'
import { TurnstileField } from '@shared/hooks/useTurnstile.jsx'
import { applyApiErrors, focusFirstError } from '@shared/lib/formErrors'
import { Button } from '@shared/ui/Button'
import { FormField } from '@shared/ui/FormField'
import { Checkbox, Input } from '@shared/ui/Input'
import { PhoneInput } from '@shared/ui/PhoneInput'
import { useToast } from '@shared/ui/Toast'
import { talentSignupSchema } from '@shared/validation/candidate'

/**
 * The talent community sign-up (requirements LP-07, TC-02): the shortest possible form, name, email and phone,
 * no sign-in. Members get emails about new openings and company updates, each with an unsubscribe link.
 */
export function TalentSignupForm({ onDone }) {
  const toast = useToast()
  const getToken = useRef(async () => '')
  const rememberToken = useCallback((fn) => {
    getToken.current = fn
  }, [])
  const form = useForm({ resolver: zodResolver(talentSignupSchema), defaultValues: { name: '', email: '', phone: '', privacy_consent: false } })
  const errors = form.formState.errors

  const join = useMutation({
    mutationFn: async (values) => {
      const token = await getToken.current()
      await ensureCsrf()
      const { data } = await client.post('/api/v1/public/talent-community', { ...values, ...(token ? { turnstile_token: token } : {}) })
      return data
    },
    onSuccess: (data) => toast.push({ tone: 'success', message: data.message ?? "You're in. We'll email you about new openings." }),
    onError: (error) => {
      const message = applyApiErrors(error, form.setError, 'talent-')
      toast.push({ tone: 'error', message })
    },
  })

  if (join.data) {
    return (
      <div className="flex flex-col items-start gap-4" role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircleIcon className="h-7 w-7" aria-hidden="true" /></span>
        <p className="font-display text-xl font-semibold text-ink">{join.data.message ?? "You're in."}</p>
        <p className="text-sm text-muted">Every email has an unsubscribe link, so you can stop them at any time.</p>
        {onDone ? <Button variant="secondary" onClick={onDone}>Close</Button> : null}
      </div>
    )
  }

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit((values) => join.mutate(values), (problems) => focusFirstError(problems, 'talent-'))}>
      <FormField id="talent-name" label="Name" required error={errors.name?.message}>
        <Input id="talent-name" autoComplete="name" invalid={Boolean(errors.name)} {...form.register('name')} />
      </FormField>
      <FormField id="talent-email" label="Email" required error={errors.email?.message}>
        <Input id="talent-email" type="email" autoComplete="email" invalid={Boolean(errors.email)} {...form.register('email')} />
      </FormField>
      <FormField id="talent-phone" label="Phone number" required error={errors.phone?.message}>
        {({ describedBy }) => (
          <Controller control={form.control} name="phone" render={({ field }) => <PhoneInput id="talent-phone" value={field.value} onChange={field.onChange} invalid={Boolean(errors.phone)} describedBy={describedBy} />} />
        )}
      </FormField>
      <div>
        <Checkbox label={<>I agree to the <Link className="text-brand-700 underline" to="/privacy">privacy policy</Link>.</>} {...form.register('privacy_consent')} />
        {errors.privacy_consent ? <p className="text-sm text-danger" role="alert">{errors.privacy_consent.message}</p> : null}
      </div>
      <TurnstileField onToken={rememberToken} />
      <Button type="submit" className="w-full" loading={join.isPending}>Get job alerts</Button>
    </form>
  )
}

TalentSignupForm.propTypes = { onDone: PropTypes.func }

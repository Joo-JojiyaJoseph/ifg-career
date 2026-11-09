import { useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { m } from 'framer-motion'
import { CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { client, ensureCsrf } from '@shared/api/createClient'
import { applyApiErrors, focusFirstError, toFormData } from '@shared/lib/formErrors'
import { TurnstileField } from '@shared/hooks/useTurnstile.jsx'
import { GENDER_OPTIONS, quickApplySchema } from '@shared/validation/candidate'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { Checkbox } from '@shared/ui/Input'
import { DateInput } from '@shared/ui/DateInput'
import { todayIso } from '@shared/lib/formatDate'
import { FileUpload } from '@shared/ui/FileUpload'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { PhoneInput } from '@shared/ui/PhoneInput'
import { Select } from '@shared/ui/Select'
import { useToast } from '@shared/ui/Toast'
import { Reveal } from '@shared/ui/Motion'
import { PaperPlaneIllustration } from '@shared/ui/illustrations/PaperPlane'
import { fetchPublicMeta } from '../jobs/api'
import { startGoogleSignIn } from '../auth/api'
import { TalentSignupForm } from './TalentSignupForm'

const DEFAULT_INTRO = "Not sure which role is right for you? That's okay.\n\nTell us a little about yourself, your interests, and your qualifications. Share your profile with us, and we'll consider you for suitable opportunities across Infolks Group."

/**
 * Section 5: "Your story could begin here" on a blue band. The intro centred above two cards: Quick Apply
 * (a general application, no sign-in) and the talent community sign-up (job alerts by email).
 */
export function QuickApplySection({ section, confirmation }) {
  const paragraphs = String(section?.intro || DEFAULT_INTRO).split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean)

  return (
    <section id="quick-apply" className="relative isolate scroll-mt-20 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink py-20 md:py-28" aria-labelledby="quick-apply-title">
      <div className="pointer-events-none absolute -right-40 top-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-cyan/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 -z-10 h-80 w-[36rem] rounded-full bg-violet/30 blur-3xl" aria-hidden="true" />
      <div className="mx-auto max-w-5xl px-4 2xl:max-w-6xl">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center text-white">
          <PaperPlaneIllustration className="mx-auto mb-2 h-20 w-auto" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Two minutes, no sign-in</p>
          <h2 id="quick-apply-title" className="mt-3 font-display text-[clamp(1.85rem,2.2vw+1rem,2.9rem)] font-semibold leading-[1.1] tracking-tight">{section?.title ?? 'Your story could begin here'}</h2>
          {paragraphs.map((text, index) => (
            <p key={index} className={`mt-3 leading-relaxed ${index ? 'text-white/70' : 'font-display text-lg text-cyan-100'}`}>{text}</p>
          ))}
        </Reveal>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <QuickApplyForm confirmation={confirmation} />
          <div className="flex flex-col gap-4">
            <Card variant="frost" className="p-6">
              <h3 className="font-display text-xl font-semibold text-ink">Join the talent community</h3>
              <p className="mb-5 mt-1 text-sm text-muted">Hear about new openings at Infolks Group. No sign-in needed.</p>
              <TalentSignupForm />
            </Card>
            <p className="flex items-start gap-2 px-2 text-sm text-white/70">
              <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
              Your resume is stored privately and only our HR team can open it.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

QuickApplySection.propTypes = {
  section: PropTypes.shape({ title: PropTypes.string, intro: PropTypes.string, image: PropTypes.string }),
  confirmation: PropTypes.shape({ title: PropTypes.string, body: PropTypes.string }),
}

/**
 * The Quick Apply form (correction 6): Full name, Date of birth, Email ID, Phone, Gender, Highest qualification,
 * Location, Department and Resume. Used in the career page section and, on other pages,
 * in the Quick Apply dialog (`bare` drops the card and heading, which the dialog provides).
 */
export function QuickApplyForm({ confirmation, bare = false }) {
  const toast = useToast()
  const queryClient = useQueryClient()
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
      gender: '',
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
      // A first-time candidate is now signed in: refresh the header so Candidate profile shows their name.
      if (data.signed_in) queryClient.invalidateQueries({ queryKey: ['candidate', 'me'] })
    },
    onError: (error) => applyApiErrors(error, form.setError),
  })

  if (mutation.data) {
    return (
      <Wrap bare={bare} className="p-6 sm:p-10" role="status">
        <m.div className="flex flex-col items-start gap-4" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal text-white shadow-glow">
            <CheckCircleIcon className="h-8 w-8" aria-hidden="true" />
          </span>
          <h3 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{confirmation?.title || 'Thank you for sharing your profile with us!'}</h3>
          <p className="max-w-lg text-text">{confirmation?.body || mutation.data.confirmation}</p>
          {mutation.data.signed_in ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-navy sm:flex-row sm:items-center sm:justify-between">
              <p>You are now signed in. Follow the status of your application in your Candidate profile.</p>
              <Link to="/my-applications" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-brand-600 px-5 font-semibold text-white transition duration-200 hover:bg-brand-700">Candidate profile</Link>
            </div>
          ) : null}
          {mutation.data.profile_notice ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-navy sm:flex-row sm:items-center sm:justify-between">
              <p>{mutation.data.profile_notice}</p>
              <Button variant="secondary" className="shrink-0" onClick={() => startGoogleSignIn('/my-applications')}>Sign in with Google</Button>
            </div>
          ) : null}
        </m.div>
      </Wrap>
    )
  }

  // Two companies can each have, say, "Engineering"; name the company so candidates can tell them apart.
  const departments = (meta.data?.departments ?? []).map((department) => ({
    value: String(department.id),
    label: department.entity_name ? `${department.name} · ${department.entity_name}` : department.name,
  }))

  return (
    <Wrap bare={bare} className="p-6 sm:p-8">
      {bare ? null : (
        <>
          <h3 className="font-display text-2xl font-semibold text-ink">Quick Apply</h3>
          <p className="mt-1 text-sm text-muted">Apply without choosing a role. Infolks Group keeps your details for the department you pick.</p>
        </>
      )}
      <form
        className="mt-6 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values), focusFirstError)}
        noValidate
      >
        <Honeypot id="quick-company-website" register={form.register} />
        <div className="sm:col-span-2 [&:has(>div:empty):not(:has(>p))]:hidden">
          <TurnstileField onToken={rememberToken} />
          {mutation.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger" role="alert">{mutation.error.message}</p> : null}
        </div>
        <FormField id="name" label="Full name" required error={form.formState.errors.name?.message}>
          <Input id="name" invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
        </FormField>
        <FormField id="date_of_birth" label="Date of birth" required error={form.formState.errors.date_of_birth?.message}>
          {({ describedBy }) => (
            <Controller
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <DateInput id="date_of_birth" max={todayIso()} value={field.value} onChange={field.onChange} invalid={Boolean(form.formState.errors.date_of_birth)} describedBy={describedBy} />
              )}
            />
          )}
        </FormField>
        <FormField id="email" label="Email ID" required error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
        </FormField>
        <FormField id="gender" label="Gender" required error={form.formState.errors.gender?.message}>
          {({ describedBy }) => (
            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <Select id="gender" value={field.value} onChange={field.onChange} options={GENDER_OPTIONS} placeholder="Choose" invalid={Boolean(form.formState.errors.gender)} describedBy={describedBy} />
              )}
            />
          )}
        </FormField>
        <div className="sm:col-span-2">
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
        </div>
        <FormField id="highest_qualification" label="Highest qualification" required error={form.formState.errors.highest_qualification?.message}>
          <Input id="highest_qualification" invalid={Boolean(form.formState.errors.highest_qualification)} {...form.register('highest_qualification')} />
        </FormField>
        <FormField id="location" label="Location" required error={form.formState.errors.location?.message}>
          <Input id="location" placeholder="City or town" invalid={Boolean(form.formState.errors.location)} {...form.register('location')} />
        </FormField>
        <div>
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
        </div>
        <div className="sm:col-span-2">
        <FormField id="resume" label="Upload resume (PDF or DOCX)" required error={form.formState.errors.resume?.message}>
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
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <Checkbox label="Keep me updated about new roles" {...form.register('keep_updated')} />
          <Checkbox
            label={<>I agree to the <Link className="text-brand-700 underline" to="/privacy">privacy policy</Link>.</>}
            {...form.register('privacy_consent')}
          />
          {form.formState.errors.privacy_consent ? <p className="text-sm text-danger" role="alert">{form.formState.errors.privacy_consent.message}</p> : null}
        </div>
        <Button type="submit" className="w-full sm:col-span-2" loading={mutation.isPending}>Submit application</Button>
      </form>
    </Wrap>
  )
}

QuickApplyForm.propTypes = {
  confirmation: PropTypes.shape({ title: PropTypes.string, body: PropTypes.string }),
  bare: PropTypes.bool,
}

/** The frosted card, or nothing extra when the form sits inside the dialog. */
function Wrap({ bare, className, children, ...props }) {
  if (bare) return <div {...props}>{children}</div>
  return <Card variant="frost" className={className} {...props}>{children}</Card>
}

Wrap.propTypes = { bare: PropTypes.bool, className: PropTypes.string, children: PropTypes.node }

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

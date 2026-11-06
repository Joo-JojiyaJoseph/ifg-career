import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, CheckIcon, ClipboardDocumentIcon, DevicePhoneMobileIcon, EyeIcon, EyeSlashIcon, KeyIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { FormField } from '@shared/ui/FormField'
import { Input, Checkbox } from '@shared/ui/Input'
import { useToast } from '@shared/ui/Toast'
import { loginSchema, twoFactorSchema } from '@shared/validation/auth'
import { beginTwoFactorSetup, challengeTwoFactor, confirmTwoFactor, login } from '../features/auth/api'
import { useAuth } from '../features/auth/AuthProvider'

export function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const auth = useAuth()
  const [step, setStep] = useState('password')
  const [setup, setSetup] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState(null)
  const [formError, setFormError] = useState('')
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { remember: false } })
  const codeForm = useForm({ resolver: zodResolver(twoFactorSchema), defaultValues: { code: '' } })

  async function onSubmit(values) {
    setFormError('')
    try {
      const result = await login(values)
      if (result.status === 'authenticated') {
        auth.setUser(result.data)
        navigate('/')
        return
      }
      if (result.status === 'two_factor_setup_required') {
        setSetup(await beginTwoFactorSetup())
        setStep('setup')
        return
      }
      if (result.status === 'two_factor_required') {
        setStep('challenge')
        return
      }
      setFormError('Sign-in did not complete.')
    } catch (error) {
      setFormError(error.message)
      toast.push({ tone: 'error', message: error.message })
    }
  }

  async function onCode(values) {
    try {
      const result = step === 'setup' ? await confirmTwoFactor(values.code) : await challengeTwoFactor(values.code)
      auth.setUser(result.data)
      if (result.recovery_codes) {
        setRecoveryCodes(result.recovery_codes)
        return
      }
      navigate('/')
    } catch (error) {
      toast.push({ tone: 'error', message: error.message })
    }
  }

  if (recoveryCodes) {
    return <RecoveryCodes codes={recoveryCodes} onContinue={() => navigate('/')} />
  }

  if (step !== 'password') {
    // A fresh form per step (key), so the browser never carries the email into the code box.
    return (
      <CodeStep
        key={step}
        step={step}
        setup={setup}
        form={codeForm}
        onSubmit={onCode}
        onBack={() => {
          codeForm.reset({ code: '' })
          setSetup(null)
          setStep('password')
        }}
      />
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="pb-2">
        <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-ink">Welcome back</h2>
        <p className="mt-1 text-sm text-muted">Sign in with your HR or Admin account.</p>
      </div>
      {formError ? (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
      <FormField id="email" label="Email" required error={form.formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="username" invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
      </FormField>
      <FormField id="password" label="Password" required error={form.formState.errors.password?.message}>
        <div className="relative">
          <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" invalid={Boolean(form.formState.errors.password)} {...form.register('password')} />
          <button type="button" className="absolute right-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeSlashIcon className="mx-auto h-5 w-5" /> : <EyeIcon className="mx-auto h-5 w-5" />}
          </button>
        </div>
      </FormField>
      <div className="flex flex-wrap items-center justify-between gap-x-4 [&_label]:whitespace-nowrap">
        <Checkbox label="Remember me" {...form.register('remember')} />
        <Link className="inline-flex min-h-11 items-center whitespace-nowrap text-sm font-medium text-brand-700 hover:underline" to="/forgot-password">
          Forgot password
        </Link>
      </div>
      <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
        Sign in
      </Button>
    </form>
  )
}

/** Groups a setup key in fours so it can be typed into an authenticator app without mistakes. */
function groupKey(secret) {
  return (secret ?? '').replace(/\s+/g, '').match(/.{1,4}/g)?.join(' ') ?? ''
}

function useCopy() {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  async function copy(text, message) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.push({ tone: 'success', message })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.push({ tone: 'error', message: 'Copy is not available here. Select the text and copy it instead.' })
    }
  }
  return { copied, copy }
}

function CodeStep({ step, setup, form, onSubmit, onBack }) {
  const [useRecovery, setUseRecovery] = useState(false)
  const { copied, copy } = useCopy()
  const isSetup = step === 'setup'
  const error = form.formState.errors.code?.message

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
      <div>
        <button type="button" onClick={onBack} className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-muted transition duration-200 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Back to sign in
        </button>
        <h2 className="font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">{isSetup ? 'Set up two-factor sign-in' : 'Two-factor check'}</h2>
        <p className="mt-1 text-sm text-muted">
          {isSetup
            ? 'Admin accounts need an authenticator app. It takes about a minute, once.'
            : useRecovery
              ? 'Enter one of the recovery codes you saved when you set up two-factor sign-in.'
              : 'Open your authenticator app and enter the 6-digit code for Infolks Group.'}
        </p>
      </div>

      {isSetup && setup ? (
        <ol className="space-y-4">
          <li className="rounded-2xl border border-border bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">1</span>
              Scan this code
            </p>
            <p className="mt-1 text-xs text-muted">
              <DevicePhoneMobileIcon className="mr-1 inline h-4 w-4 align-[-3px]" aria-hidden="true" />
              Google Authenticator, Microsoft Authenticator or Authy: tap <span className="font-medium">+</span>, then scan.
            </p>
            <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr_svg)}`}
                alt="QR code to add Infolks Group to your authenticator app"
                width="168"
                height="168"
                className="h-40 w-40 shrink-0 rounded-xl border border-border bg-white p-2"
              />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-xs font-medium text-muted">Can&apos;t scan? Enter this key instead:</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold tracking-wider text-ink">{groupKey(setup.secret)}</p>
                <button
                  type="button"
                  onClick={() => copy(setup.secret, 'Setup key copied.')}
                  className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-brand-700 transition duration-200 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {copied ? <CheckIcon className="h-4 w-4" aria-hidden="true" /> : <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy key'}
                </button>
              </div>
            </div>
          </li>
          <li className="flex items-center gap-2 px-1 text-sm font-semibold text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">2</span>
            Enter the 6-digit code the app shows
          </li>
        </ol>
      ) : null}

      <FormField id="two-factor-code" label={useRecovery ? 'Recovery code' : 'Authenticator code'} required error={error}>
        <Input
          id="two-factor-code"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- the code box is the only thing to do on this step
          autoFocus
          inputMode={useRecovery ? 'text' : 'numeric'}
          autoComplete={useRecovery ? 'off' : 'one-time-code'}
          maxLength={useRecovery ? 40 : 6}
          placeholder={useRecovery ? 'xxxxx-xxxxx' : '000000'}
          className={useRecovery ? 'font-mono' : 'text-center font-mono text-2xl tracking-[0.5em]'}
          invalid={Boolean(error)}
          {...form.register('code', {
            setValueAs: (value) => (useRecovery ? value.trim() : value.replace(/\D/g, '')),
          })}
        />
      </FormField>

      <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
        {isSetup ? 'Verify and turn on' : 'Verify'}
      </Button>

      {!isSetup ? (
        <button
          type="button"
          onClick={() => {
            setUseRecovery((value) => !value)
            form.reset({ code: '' })
          }}
          className="mx-auto flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
        >
          <KeyIcon className="h-4 w-4" aria-hidden="true" />
          {useRecovery ? 'Use my authenticator app instead' : 'Lost your phone? Use a recovery code'}
        </button>
      ) : null}
    </form>
  )
}

CodeStep.propTypes = {
  step: PropTypes.oneOf(['setup', 'challenge']).isRequired,
  setup: PropTypes.shape({ qr_svg: PropTypes.string, secret: PropTypes.string }),
  form: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

function RecoveryCodes({ codes, onContinue }) {
  const { copied, copy } = useCopy()

  return (
    <div className="space-y-5">
      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckIcon className="h-4 w-4" aria-hidden="true" /> Two-factor sign-in is on
        </p>
        <h2 className="mt-3 font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">Save your recovery codes</h2>
        <p className="mt-1 text-sm text-muted">If you lose your phone, each code signs you in once. Keep them somewhere safe, such as a password manager. They won&apos;t be shown again.</p>
      </div>
      <ul className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-brand-50/60 p-4 font-mono text-sm text-ink">
        {codes.map((code) => (
          <li key={code} className="rounded-lg bg-white px-2 py-1.5 text-center">{code}</li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" className="w-full" icon={copied ? CheckIcon : ClipboardDocumentIcon} onClick={() => copy(codes.join('\n'), 'Recovery codes copied.')}>
          {copied ? 'Copied' : 'Copy codes'}
        </Button>
        <Button className="w-full" onClick={onContinue}>I&apos;ve saved them</Button>
      </div>
    </div>
  )
}

RecoveryCodes.propTypes = { codes: PropTypes.arrayOf(PropTypes.string).isRequired, onContinue: PropTypes.func.isRequired }

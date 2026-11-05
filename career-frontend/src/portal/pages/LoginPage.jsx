import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
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
  const codeForm = useForm({ resolver: zodResolver(twoFactorSchema) })

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
    return (
      <div>
        <h2 className="font-display text-2xl text-navy">Save these recovery codes</h2>
        <ul className="mt-4 space-y-1 font-mono text-sm">
          {recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <Button className="mt-6 w-full" onClick={() => navigate('/')}>
          Continue
        </Button>
      </div>
    )
  }

  if (step !== 'password') {
    return (
      <form onSubmit={codeForm.handleSubmit(onCode)} className="space-y-4">
        <h2 className="font-display text-2xl text-navy">{step === 'setup' ? 'Set up your authenticator' : 'Enter your code'}</h2>
        {setup ? (
          <>
            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr_svg)}`} alt="Authenticator QR code" width="192" height="192" />
            <p className="text-sm text-muted">Or enter this key: {setup.secret}</p>
          </>
        ) : null}
        <FormField id="code" label="Authenticator code" required error={codeForm.formState.errors.code?.message}>
          <Input id="code" inputMode="numeric" autoComplete="one-time-code" invalid={Boolean(codeForm.formState.errors.code)} {...codeForm.register('code')} />
        </FormField>
        <Button type="submit" className="w-full" loading={codeForm.formState.isSubmitting}>
          Verify
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="font-display text-2xl text-navy">Sign in</h2>
      <p className="text-sm text-muted">HR and Admin accounts only.</p>
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
      <div className="flex items-center justify-between">
        <Checkbox label="Remember me" {...form.register('remember')} />
        <Link className="text-sm text-brand-700" to="/forgot-password">
          Forgot password
        </Link>
      </div>
      <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
        Sign in
      </Button>
    </form>
  )
}

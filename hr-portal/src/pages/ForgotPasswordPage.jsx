import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shared/ui/Button'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { useToast } from '@shared/ui/Toast'
import { forgotPasswordSchema } from '@shared/validation/auth'
import { forgotPassword } from '../features/auth/api'

export function ForgotPasswordPage() {
  const toast = useToast()
  const form = useForm({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values) {
    try {
      const result = await forgotPassword(values.email)
      toast.push({ tone: 'success', message: result.message })
    } catch (error) {
      toast.push({ tone: 'error', message: error.message })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Reset your password</h2>
      <FormField id="email" label="Email" required error={form.formState.errors.email?.message}>
        <Input id="email" type="email" {...form.register('email')} />
      </FormField>
      <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
        Send reset link
      </Button>
      <Link className="block text-center text-sm text-brand-700" to="/login">
        Back to sign in
      </Link>
    </form>
  )
}

import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shared/ui/Button'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { useToast } from '@shared/ui/Toast'
import { resetPasswordSchema } from '@shared/validation/auth'
import { resetPassword } from '../features/auth/api'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const toast = useToast()
  const form = useForm({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(values) {
    try {
      const result = await resetPassword({
        ...values,
        email: params.get('email'),
        token: params.get('token'),
      })
      toast.push({ tone: 'success', message: result.message })
    } catch (error) {
      toast.push({ tone: 'error', message: error.message })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="font-display text-2xl text-navy">Choose a new password</h2>
      <FormField id="password" label="New password" required error={form.formState.errors.password?.message}>
        <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
      </FormField>
      <FormField id="password_confirmation" label="Confirm password" required error={form.formState.errors.password_confirmation?.message}>
        <Input id="password_confirmation" type="password" autoComplete="new-password" {...form.register('password_confirmation')} />
      </FormField>
      <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
        Update password
      </Button>
    </form>
  )
}

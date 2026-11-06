import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address.'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(10, 'Use at least 10 characters.'),
    password_confirmation: z.string(),
  })
  .refine((value) => value.password === value.password_confirmation, {
    path: ['password_confirmation'],
    message: 'The passwords do not match.',
  })

export const twoFactorSchema = z.object({
  code: z.string().min(6, 'Enter the 6-digit code.'),
})

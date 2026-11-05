import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

dayjs.extend(customParseFormat)

const phone = z.string().min(1, 'Enter your phone number.').refine((value) => {
  const parsed = parsePhoneNumberFromString(value)
  return Boolean(parsed?.isValid())
}, 'Enter a valid phone number for the selected country.')

const dateOfBirth = z
  .string()
  .min(1, 'Enter your date of birth.')
  .refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid() && dayjs(value).isBefore(dayjs(), 'day'), 'Enter a past date.')
  .refine((value) => {
    const age = dayjs().diff(dayjs(value), 'year')
    return age >= 16 && age <= 70
  }, 'Enter a date of birth for someone aged 16 to 70.')

const resumeFile = z
  .any()
  .refine((file) => file instanceof File, 'Add your resume.')
  .refine((file) => !(file instanceof File) || file.size <= 5 * 1024 * 1024, 'The resume must be 5 MB or smaller.')
  .refine((file) => !(file instanceof File) || /\.(pdf|docx)$/i.test(file.name), 'Upload a PDF or DOCX file.')

const optionalResume = z
  .any()
  .refine((file) => file == null || file instanceof File, 'Upload a PDF or DOCX file.')
  .refine((file) => !(file instanceof File) || file.size <= 5 * 1024 * 1024, 'The resume must be 5 MB or smaller.')
  .refine((file) => !(file instanceof File) || /\.(pdf|docx)$/i.test(file.name), 'Upload a PDF or DOCX file.')

const optionalUrl = (message) => z.union([z.literal(''), z.url(message)]).optional()

const requiredNumber = (emptyMessage, negativeMessage) =>
  z.any().refine((value) => typeof value === 'number' && !Number.isNaN(value), emptyMessage).refine((value) => typeof value === 'number' && value >= 0, negativeMessage)

export const quickApplySchema = z.object({
  name: z.string().min(1, 'Enter your full name.').min(2, 'Use at least 2 characters.').max(100, 'Use at most 100 characters.'),
  date_of_birth: dateOfBirth,
  email: z.email('Enter a valid email address.'),
  phone,
  highest_qualification: z.string().min(1, 'Enter your highest qualification.'),
  location: z.string().min(1, 'Enter your city or town.'),
  department_id: z.string().min(1, 'Choose a department.'),
  resume: resumeFile,
  keep_updated: z.boolean().optional(),
  privacy_consent: z.boolean().refine((value) => value === true, 'Agree to the privacy policy to continue.'),
})

export const talentSignupSchema = z.object({
  name: z.string().min(1, 'Enter your name.').min(2, 'Use at least 2 characters.').max(100, 'Use at most 100 characters.'),
  email: z.email('Enter a valid email address.'),
  phone,
  privacy_consent: z.boolean().refine((value) => value === true, 'Agree to the privacy policy to continue.'),
})

export const profileSchema = z.object({
  name: z.string().min(2, 'Use at least 2 characters.').max(100, 'Use at most 100 characters.'),
  date_of_birth: dateOfBirth,
  phone,
  location: z.string().min(1, 'Enter your city and country.'),
  gender: z.string().min(1, 'Choose a gender.'),
  highest_qualification: z.string().min(1, 'Enter your highest qualification.'),
  preferred_department_id: z.string().min(1, 'Choose a department.'),
  years_experience: requiredNumber('Enter your years of experience.', 'Years of experience cannot be negative.'),
  current_ctc: requiredNumber('Enter your current CTC.', 'Current CTC cannot be negative.'),
  expected_ctc: requiredNumber('Enter your expected CTC.', 'Expected CTC cannot be negative.'),
  linkedin_url: optionalUrl('Enter a valid LinkedIn URL.'),
  portfolio_url: optionalUrl('Enter a valid portfolio URL.'),
})

export function jobApplySchema(hasResume) {
  return z.object({
    name: z.string().min(2, 'Use at least 2 characters.'),
    phone,
    location: z.string().min(1, 'Enter your city and country.'),
    gender: z.string().min(1, 'Choose a gender.'),
    years_experience: requiredNumber('Enter your years of experience.', 'Years of experience cannot be negative.'),
    current_ctc: requiredNumber('Enter your current CTC.', 'Current CTC cannot be negative.'),
    expected_ctc: requiredNumber('Enter your expected CTC.', 'Expected CTC cannot be negative.'),
    reference_id: z.string().max(50).optional(),
    resume: hasResume ? optionalResume : resumeFile,
    linkedin_url: optionalUrl('Enter a valid LinkedIn URL.'),
    portfolio_url: optionalUrl('Enter a valid portfolio URL.'),
    save_to_profile: z.boolean().optional(),
  })
}

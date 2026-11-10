import { fileToDataUrl } from './inlineFile'

export function focusFirstError(errors, prefix = '') {
  const key = Object.keys(errors ?? {})[0]
  if (!key) return
  const el = document.getElementById(`${prefix}${key}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el?.focus()
}

export function applyApiErrors(error, setError, prefix = '') {
  const errors = error?.errors || {}
  let first = null
  Object.entries(errors).forEach(([key, messages]) => {
    if (key === 'application') return
    const message = Array.isArray(messages) ? messages[0] : messages
    setError(key, { type: 'server', message })
    first ??= key
  })
  if (first) focusFirstError({ [first]: true }, prefix)
  return error?.message || 'Something went wrong. Please try again.'
}

/** Form fields plus the resume. The resume is sent as a data URL (see inlineFile.js). */
export async function toFormData(values, file) {
  const body = new FormData()
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || key === 'resume') return
    if (typeof value === 'boolean') {
      body.append(key, value ? '1' : '0')
      return
    }
    body.append(key, String(value))
  })
  if (file instanceof File) body.append('resume', await fileToDataUrl(file))
  return body
}

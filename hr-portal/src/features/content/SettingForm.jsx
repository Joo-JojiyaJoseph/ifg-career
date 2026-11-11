import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { useToast } from '@shared/ui/Toast'
import { FieldInput } from './FieldInput'
import { saveSetting } from './api'
import { settingForms } from './fields'

/**
 * Form for one site setting (banner, numbers, footer…).
 */
export function SettingForm({ settingKey, value = {} }) {
  const form = settingForms[settingKey]
  const toast = useToast()
  const queryClient = useQueryClient()
  const [values, setValues] = useState(value)
  const [source, setSource] = useState(value)
  const [errors, setErrors] = useState({})

  if (value !== source) {
    setSource(value)
    setValues(value)
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {}
      form.fields.forEach((field) => {
        if (field.type === 'image') {
          if (values[field.name] instanceof File) payload.image = values[field.name]
        } else payload[field.name] = values[field.name] ?? ''
      })
      return saveSetting(settingKey, payload)
    },
    onSuccess: () => {
      toast.push({ tone: 'success', message: `${form.title} saved` })
      setErrors({})
      queryClient.invalidateQueries({ queryKey: ['hr-content', 'settings'] })
    },
    onError: (error) => {
      setErrors(Object.fromEntries(Object.entries(error.errors ?? {}).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages])))
      toast.push({ tone: 'error', message: error.message })
    },
  })

  return (
    <Card>
      <form className="flex flex-col gap-4" noValidate onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
        <div>
          <h2 className="font-display text-lg font-semibold text-navy">{form.title}</h2>
          {form.hint ? <p className="text-sm text-muted">{form.hint}</p> : null}
        </div>
        <div className={`grid gap-4 ${form.fields.every((field) => field.type === 'number') ? 'sm:grid-cols-3' : ''}`}>
          {form.fields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={field.type === 'image' ? (values[field.name] instanceof File ? values[field.name] : null) : values[field.name]}
              currentImage={field.current ? value[field.current] : undefined}
              processing={field.current ? value[field.current.replace(/_url$/, '_processing')] : undefined}
              error={errors[field.type === 'image' ? 'image' : field.name]}
              onChange={(next) => setValues((current) => ({ ...current, [field.name]: next }))}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={save.isPending}>Save</Button>
        </div>
      </form>
    </Card>
  )
}

SettingForm.propTypes = { settingKey: PropTypes.string.isRequired, value: PropTypes.object }

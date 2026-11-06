import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { FormField } from '@shared/ui/FormField'
import { ImageField } from '@shared/ui/ImageField'
import { Input, Textarea } from '@shared/ui/Input'
import { useToast } from '@shared/ui/Toast'
import { saveEntity } from './api'

const colours = [
  ['primary_color', 'Primary colour'],
  ['secondary_color', 'Secondary colour'],
  ['accent_color', 'Accent colour'],
]

/**
 * The four entity cards: motto, description, theme colours, logo and pattern.
 */
export function EntitiesEditor({ entities = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {entities.map((entity) => <EntityCardForm key={entity.slug} entity={entity} />)}
    </div>
  )
}

function EntityCardForm({ entity }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [values, setValues] = useState(entity)
  const [source, setSource] = useState(entity)
  const [files, setFiles] = useState({ logo: null, pattern: null })
  const [errors, setErrors] = useState({})

  if (entity !== source) {
    setSource(entity)
    setValues(entity)
    setFiles({ logo: null, pattern: null })
  }

  const save = useMutation({
    mutationFn: () => saveEntity(entity.slug, {
      motto: values.motto ?? '',
      short_description: values.short_description ?? '',
      primary_color: values.primary_color,
      secondary_color: values.secondary_color,
      accent_color: values.accent_color,
      website_url: values.website_url ?? '',
      ...(files.logo ? { logo: files.logo } : {}),
      ...(files.pattern ? { pattern: files.pattern } : {}),
    }),
    onSuccess: () => {
      toast.push({ tone: 'success', message: `${entity.name} saved` })
      setErrors({})
      queryClient.invalidateQueries({ queryKey: ['hr-content', 'entities'] })
      queryClient.invalidateQueries({ queryKey: ['public-entities'] })
    },
    onError: (error) => {
      setErrors(Object.fromEntries(Object.entries(error.errors ?? {}).map(([key, value]) => [key, value[0]])))
      toast.push({ tone: 'error', message: error.message })
    },
  })

  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  return (
    <Card className="flex flex-col gap-4 border-t-4" style={{ borderTopColor: values.primary_color }}>
      <h2 className="font-display text-lg font-semibold text-navy">{entity.name}</h2>
      <FormField id={`${entity.slug}-motto`} label="Motto" error={errors.motto}>
        <Input id={`${entity.slug}-motto`} maxLength={150} value={values.motto ?? ''} onChange={set('motto')} />
      </FormField>
      <FormField id={`${entity.slug}-description`} label="Short description" hint="2 to 3 lines." error={errors.short_description}>
        <Textarea id={`${entity.slug}-description`} rows={3} maxLength={400} value={values.short_description ?? ''} onChange={set('short_description')} />
      </FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {colours.map(([key, label]) => (
          <FormField key={key} id={`${entity.slug}-${key}`} label={label} error={errors[key]}>
            <div className="flex items-center gap-2">
              <input type="color" aria-label={`${label} picker`} className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-border" value={values[key] ?? '#1976D2'} onChange={set(key)} />
              <Input id={`${entity.slug}-${key}`} value={values[key] ?? ''} onChange={set(key)} maxLength={7} />
            </div>
          </FormField>
        ))}
      </div>
      <FormField id={`${entity.slug}-website`} label="Website" error={errors.website_url}>
        <Input id={`${entity.slug}-website`} type="url" value={values.website_url ?? ''} onChange={set('website_url')} />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id={`${entity.slug}-logo`} label="Logo" error={errors.logo}>
          <ImageField id={`${entity.slug}-logo`} accept="image/png,image/webp,image/svg+xml" currentUrl={entity.theme?.logo_url} file={files.logo} onChange={(logo) => setFiles((current) => ({ ...current, logo }))} hint="SVG or transparent PNG." />
        </FormField>
        <FormField id={`${entity.slug}-pattern`} label="Pattern" error={errors.pattern}>
          <ImageField id={`${entity.slug}-pattern`} accept="image/svg+xml,image/png,image/webp" currentUrl={entity.theme?.pattern_url} file={files.pattern} onChange={(pattern) => setFiles((current) => ({ ...current, pattern }))} hint="Subtle background pattern." />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button loading={save.isPending} onClick={() => save.mutate()}>Save {entity.name}</Button>
      </div>
    </Card>
  )
}

EntitiesEditor.propTypes = { entities: PropTypes.array }
EntityCardForm.propTypes = { entity: PropTypes.object.isRequired }

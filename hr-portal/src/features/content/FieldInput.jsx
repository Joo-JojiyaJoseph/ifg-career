import { lazy, Suspense } from 'react'
import PropTypes from 'prop-types'
import { DateInput } from '@shared/ui/DateInput'
import { FormField } from '@shared/ui/FormField'
import { IconPicker } from '@shared/ui/IconPicker'
import { ImageField } from '@shared/ui/ImageField'
import { Input, Textarea } from '@shared/ui/Input'
import { Select } from '@shared/ui/Select'
import { Skeleton } from '@shared/ui/Skeleton'
import { Switch } from '@shared/ui/Switch'

const RichTextEditor = lazy(() => import('@shared/ui/RichTextEditor'))

/**
 * Renders one content field from its definition in fields.js.
 */
export function FieldInput({ field, value, onChange, error, entities = [], currentImage, processing, creating }) {
  const id = `content-${field.name}`
  const required = field.required || (creating && field.requiredOnCreate)

  if (field.type === 'switch') {
    return (
      <div>
        <Switch checked={Boolean(value)} onChange={onChange} label={field.label} />
        {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      </div>
    )
  }

  return (
    <FormField id={id} label={field.label} required={required} error={error} hint={field.type === 'image' ? undefined : field.hint ?? (field.max ? `Up to ${field.max} characters.` : undefined)}>
      {renderControl()}
    </FormField>
  )

  function renderControl() {
    switch (field.type) {
      case 'textarea':
        return <Textarea id={id} rows={4} maxLength={field.max} value={value ?? ''} invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
      case 'number':
        return <Input id={id} type="number" inputMode="numeric" min={0} value={value ?? ''} invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
      case 'date':
        return <DateInput id={id} value={value ?? ''} invalid={Boolean(error)} onChange={onChange} />
      case 'select':
        return <Select id={id} value={value ?? ''} onChange={onChange} options={[{ value: '', label: 'Choose' }, ...field.options]} />
      case 'entity':
        return <Select id={id} value={value ?? ''} onChange={onChange} options={[{ value: '', label: 'Infolks Group (no entity)' }, ...entities.map((entity) => ({ value: entity.slug, label: entity.name }))]} />
      case 'icon':
        return <IconPicker id={id} value={value} onChange={onChange} />
      case 'image':
        return <ImageField id={id} file={value instanceof File ? value : null} currentUrl={currentImage} onChange={onChange} accept={field.accept} hint={field.hint} invalid={Boolean(error)} processing={processing} />
      case 'richtext':
        return (
          <Suspense fallback={<Skeleton className="h-48" />}>
            <RichTextEditor id={id} value={value ?? ''} invalid={Boolean(error)} onChange={onChange} />
          </Suspense>
        )
      default:
        return <Input id={id} maxLength={field.max} value={value ?? ''} invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
    }
  }
}

FieldInput.propTypes = {
  field: PropTypes.object.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  entities: PropTypes.array,
  currentImage: PropTypes.string,
  processing: PropTypes.bool,
  creating: PropTypes.bool,
}

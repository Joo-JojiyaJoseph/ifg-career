import { useState } from 'react'
import PropTypes from 'prop-types'
import { Button } from './Button'
import { Checkbox, Input } from './Input'
import { FormField } from './FormField'

/**
 * Name, apply, share and delete saved filter sets for one screen.
 */
export function SavedFilters({ items = [], onApply, onSave, onDelete, saving = false }) {
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isShared, setIsShared] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="font-medium text-navy">Saved filters</p>
      <div className="mt-3 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" className="min-h-11 text-left text-sm text-brand-700" onClick={() => onApply(item)}>
              {item.name}
              {item.is_default ? ' · Default' : ''}
              {item.is_shared ? ' · Shared' : ''}
            </button>
            {item.mine ? (
              <Button variant="ghost" size="sm" onClick={() => onDelete(item)}>
                Delete
              </Button>
            ) : null}
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted">No saved filters yet.</p> : null}
      </div>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          onSave({ name: name.trim(), is_default: isDefault, is_shared: isShared })
          setName('')
          setIsDefault(false)
          setIsShared(false)
        }}
      >
        <FormField id="saved-filter-name" label="Filter name">
          <Input id="saved-filter-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
        </FormField>
        <Checkbox label="Use as my default" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
        <Checkbox label="Share with the team" checked={isShared} onChange={(event) => setIsShared(event.target.checked)} />
        <Button type="submit" loading={saving} disabled={!name.trim()}>
          Save filter
        </Button>
      </form>
    </div>
  )
}

SavedFilters.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onApply: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool,
}

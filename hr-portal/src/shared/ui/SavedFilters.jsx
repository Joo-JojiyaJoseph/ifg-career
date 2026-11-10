import { useState } from 'react'
import PropTypes from 'prop-types'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BookmarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { Button } from './Button'
import { Checkbox, Input } from './Input'
import { FormField } from './FormField'

/**
 * "Saved views" button for a list's toolbar. It opens a small panel to apply, save, share and delete
 * named filter sets for this screen, so the page itself stays uncluttered.
 */
export function SavedFilters({ items = [], onApply, onSave, onDelete, saving = false }) {
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isShared, setIsShared] = useState(false)

  return (
    <Popover className="relative">
      <PopoverButton className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-ink transition duration-200 hover:border-brand-200 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 data-[open]:border-brand-200 data-[open]:bg-brand-50">
        {items.length ? <BookmarkSolidIcon className="h-5 w-5 text-brand-600" aria-hidden="true" /> : <BookmarkIcon className="h-5 w-5" aria-hidden="true" />}
        Saved views
        {items.length ? <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">{items.length}</span> : null}
      </PopoverButton>
      <PopoverPanel
        anchor={{ to: 'bottom end', gap: 8, padding: 12 }}
        transition
        className="z-[60] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-white p-4 shadow-lift transition duration-200 ease-out focus:outline-none data-[closed]:translate-y-1 data-[closed]:opacity-0"
      >
        {({ close }) => (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-display font-semibold text-ink">Saved filters</p>
              <p className="text-xs text-muted">Apply a saved set of filters in one click.</p>
            </div>
            {items.length ? (
              <ul className="-mx-1 flex max-h-56 flex-col overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-xl px-2 text-left transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      onClick={() => {
                        onApply(item)
                        close()
                      }}
                    >
                      <span className="truncate text-sm font-medium text-brand-700">{item.name}</span>
                      {item.is_default || item.is_shared ? (
                        <span className="text-xs text-muted">{[item.is_default && 'Default', item.is_shared && 'Shared'].filter(Boolean).join(' · ')}</span>
                      ) : null}
                    </button>
                    {item.mine ? (
                      <button
                        type="button"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-red-50 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => onDelete(item)}
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-brand-50/70 px-3 py-3 text-sm text-muted">No saved filters yet. Set up the filters you use often, then save them here.</p>
            )}
            <form
              className="flex flex-col gap-2 border-t border-border pt-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (!name.trim()) return
                onSave({ name: name.trim(), is_default: isDefault, is_shared: isShared })
                setName('')
                setIsDefault(false)
                setIsShared(false)
              }}
            >
              <FormField id="saved-filter-name" label="Save the current filters as">
                <Input id="saved-filter-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="For example: Shortlisted at Webfolks" />
              </FormField>
              <div className="flex flex-wrap gap-x-4">
                <Checkbox label="Use as my default" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
                <Checkbox label="Share with the team" checked={isShared} onChange={(event) => setIsShared(event.target.checked)} />
              </div>
              <Button type="submit" size="sm" loading={saving} disabled={!name.trim()}>
                Save filter
              </Button>
            </form>
          </div>
        )}
      </PopoverPanel>
    </Popover>
  )
}

SavedFilters.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onApply: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool,
}

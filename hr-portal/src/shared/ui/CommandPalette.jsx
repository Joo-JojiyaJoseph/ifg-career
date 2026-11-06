import PropTypes from 'prop-types'
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Skeleton } from './Skeleton'

/**
 * Ctrl/⌘+K search dialog. `results` is a list of groups: { key, label, icon, items: [{ id, title, subtitle, url }] }.
 */
export function CommandPalette({ open, onClose, query, onQueryChange, results = [], loading = false, onSelect, placeholder = 'Search' }) {
  const items = results.flatMap((group) => group.items.map((item) => ({ ...item, group: group.key })))

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-navy/40 transition duration-200 data-[closed]:opacity-0" />
      <div className="fixed inset-0 overflow-y-auto p-4 pt-[12vh]">
        <DialogPanel transition className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white shadow-card-hover transition duration-200 data-[closed]:scale-95 data-[closed]:opacity-0">
          <Combobox onChange={(item) => item && onSelect(item)}>
            <div className="flex items-center gap-3 border-b border-border px-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-muted" aria-hidden="true" />
              <ComboboxInput className="h-14 w-full border-0 bg-transparent p-0 text-base focus:ring-0" placeholder={placeholder} value={query} onChange={(event) => onQueryChange(event.target.value)} aria-label="Search" />
              <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-xs text-muted sm:inline">Esc</kbd>
            </div>
            {loading ? <div className="p-4"><Skeleton className="h-24" /></div> : null}
            {!loading && query.length >= 2 && items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">Nothing matches “{query}”.</p> : null}
            {!loading && query.length < 2 ? <p className="px-4 py-6 text-center text-sm text-muted">Type at least two letters to search candidates and jobs.</p> : null}
            {items.length ? (
              <ComboboxOptions static className="max-h-96 overflow-y-auto p-2">
                {results.filter((group) => group.items.length).map((group) => (
                  <div key={group.key} className="mb-2">
                    <p className="px-3 py-1.5 text-xs font-semibold text-muted">{group.label}</p>
                    {group.items.map((item) => (
                      <ComboboxOption key={`${group.key}-${item.id}`} value={item} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 data-[focus]:bg-brand-50">
                        {group.icon ? <group.icon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" /> : null}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-navy">{item.title}</span>
                          {item.subtitle ? <span className="block truncate text-xs text-muted">{item.subtitle}</span> : null}
                        </span>
                      </ComboboxOption>
                    ))}
                  </div>
                ))}
              </ComboboxOptions>
            ) : null}
          </Combobox>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

CommandPalette.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  results: PropTypes.array,
  loading: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
}

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BriefcaseIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline'
import { client } from '@shared/api/createClient'
import { CommandPalette } from '@shared/ui/CommandPalette'
import { useCommandShortcut } from '@shared/hooks/useCommandShortcut'
import { useDebounce } from '@shared/hooks/useDebounce'

const search = async (q) => (await client.get('/api/v1/hr/search', { params: { q } })).data.data

/**
 * The top-bar search pill. Opens the command palette (also on Ctrl/⌘+K).
 */
export function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const term = useDebounce(query.trim(), 250)
  const results = useQuery({ queryKey: ['hr-search', term], queryFn: () => search(term), enabled: open && term.length >= 2, staleTime: 30_000 })
  const show = useCallback(() => setOpen(true), [])
  useCommandShortcut(show)

  const groups = [
    { key: 'candidates', label: 'Candidates', icon: UserIcon, items: results.data?.candidates ?? [] },
    { key: 'jobs', label: 'Jobs', icon: BriefcaseIcon, items: results.data?.jobs ?? [] },
  ]

  return (
    <>
      <button type="button" onClick={show} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 text-left text-sm text-muted shadow-card transition duration-200 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        <span className="flex-1 truncate">Search candidates, jobs…</span>
        <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-xs sm:inline">Ctrl K</kbd>
      </button>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        query={query}
        onQueryChange={setQuery}
        loading={results.isFetching && !results.data}
        results={groups}
        placeholder="Search by name, email, phone or job title"
        onSelect={(item) => {
          setOpen(false)
          setQuery('')
          navigate(item.url)
        }}
      />
    </>
  )
}

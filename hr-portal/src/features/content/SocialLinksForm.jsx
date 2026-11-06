import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { FormField } from '@shared/ui/FormField'
import { IconButton } from '@shared/ui/IconButton'
import { Input } from '@shared/ui/Input'
import { Select } from '@shared/ui/Select'
import { useToast } from '@shared/ui/Toast'
import { saveSetting } from './api'

const platforms = ['Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'X', 'Threads', 'WhatsApp']

export function SocialLinksForm({ links = [] }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState(links)
  const [source, setSource] = useState(links)
  const [errors, setErrors] = useState({})

  if (links !== source) {
    setSource(links)
    setRows(links)
  }

  const save = useMutation({
    mutationFn: () => saveSetting('social_links', { links: rows }),
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Social links saved' })
      setErrors({})
      queryClient.invalidateQueries({ queryKey: ['hr-content', 'settings'] })
    },
    onError: (error) => {
      setErrors(error.errors ?? {})
      toast.push({ tone: 'error', message: error.message })
    },
  })

  const unused = platforms.filter((name) => !rows.some((row) => row.name === name))

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-navy">Social media links</h2>
        <p className="text-sm text-muted">Shown as round icons in the footer.</p>
      </div>
      {rows.map((row, index) => (
        <div key={`${row.name}-${index}`} className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
          <FormField id={`social-name-${index}`} label="Platform">
            <Select id={`social-name-${index}`} value={row.name} onChange={(name) => setRows((current) => current.map((item, position) => (position === index ? { ...item, name } : item)))} options={[row.name, ...unused].filter(Boolean).map((name) => ({ value: name, label: name }))} />
          </FormField>
          <FormField id={`social-url-${index}`} label="Link" error={errors[`links.${index}.url`]?.[0]}>
            <Input id={`social-url-${index}`} type="url" placeholder="https://" value={row.url} onChange={(event) => setRows((current) => current.map((item, position) => (position === index ? { ...item, url: event.target.value } : item)))} />
          </FormField>
          <IconButton label={`Remove ${row.name}`} className="text-danger hover:bg-red-50" onClick={() => setRows((current) => current.filter((_, position) => position !== index))}>
            <TrashIcon className="h-5 w-5" />
          </IconButton>
        </div>
      ))}
      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="secondary" icon={PlusIcon} disabled={!unused.length} onClick={() => setRows((current) => [...current, { name: unused[0], url: 'https://' }])}>Add link</Button>
        <Button loading={save.isPending} onClick={() => save.mutate()}>Save links</Button>
      </div>
    </Card>
  )
}

SocialLinksForm.propTypes = { links: PropTypes.array }

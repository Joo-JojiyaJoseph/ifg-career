import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { Card } from '@shared/ui/Card'
import { EmptyState } from '@shared/ui/Skeleton'
import { Switch } from '@shared/ui/Switch'
import { useToast } from '@shared/ui/Toast'
import { useAuth } from '../auth/AuthProvider'
import { saveEntity } from './api'

/**
 * Website Content → Our companies: only chooses which companies appear on the careers page.
 * Companies themselves (name, colours, images, details) are added and edited in Settings → Companies.
 */
export function EntityChooser({ entities = [] }) {
  const { user } = useAuth()
  const canManage = Boolean(user?.permissions?.includes('entities.manage'))
  const toast = useToast()
  const queryClient = useQueryClient()

  const toggle = useMutation({
    mutationFn: ({ entity, show }) => saveEntity(entity.slug, { is_active: show }),
    onSuccess: (_, { entity, show }) => {
      toast.push({ tone: 'success', message: show ? `${entity.name} is shown on the careers site` : `${entity.name} is hidden from the careers site` })
      queryClient.invalidateQueries({ queryKey: ['hr-content', 'entities'] })
      queryClient.invalidateQueries({ queryKey: ['hr-entities'] })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Companies on the careers page</h2>
          <p className="text-sm text-muted">Choose which companies appear in “Our story has more than one way in”. A hidden company&rsquo;s jobs are hidden too.</p>
        </div>
        {canManage ? (
          <Link to="/settings?tab=companies" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
            Add or edit companies in Settings
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {entities.length === 0 ? <EmptyState title="No companies yet" description="An Admin adds companies in Settings → Companies." /> : null}
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {entities.map((entity) => (
          <li key={entity.slug} className="flex items-center gap-4 px-4 py-3">
            <EntityLogo entity={entity} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{entity.name}</p>
              <p className="truncate text-sm text-muted">{entity.motto || 'No tagline yet'} · {entity.jobs_count ?? 0} jobs</p>
            </div>
            <Switch
              checked={Boolean(entity.is_active)}
              disabled={!canManage || toggle.isPending}
              onChange={(show) => toggle.mutate({ entity, show })}
              label={`Show ${entity.name} on the careers site`}
              srOnlyLabel
            />
          </li>
        ))}
      </ul>
      {!canManage ? <p className="text-sm text-muted">Only an Admin can change which companies are shown.</p> : null}
    </Card>
  )
}

EntityChooser.propTypes = { entities: PropTypes.array }

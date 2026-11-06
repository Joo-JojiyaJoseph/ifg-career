import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { fetchMatrix, saveMatrix } from './api'

const labels = {
  'jobs.view': 'View jobs', 'jobs.manage': 'Create and edit jobs', 'jobs.publish': 'Publish, close and extend jobs',
  'candidates.view': 'View candidates', 'candidates.update': 'Edit colour tags', 'candidates.notes': 'Add notes', 'candidates.blacklist': 'Blacklist candidates',
  'candidates.export': 'Export candidates', 'candidates.resume': 'Download resumes', 'applications.view': 'View applications', 'applications.update': 'Change application status',
  'interviews.view': 'View interviews', 'interviews.manage': 'Schedule interviews and record results', 'talent.view': 'View talent community', 'talent.export': 'Export talent community',
  'campaigns.send': 'Send job alerts and updates', 'content.manage': 'Edit website content', 'reports.view': 'View reports',
  'settings.users': 'Manage HR users and roles', 'settings.lists': 'Manage departments, teams and skills', 'audit.view': 'View audit log', 'blocks.override': 'Override 6-month blocks',
}

export function RolesPanel() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const matrix = useQuery({ queryKey: ['hr-roles'], queryFn: fetchMatrix })
  const [draft, setDraft] = useState(null)
  const [source, setSource] = useState(null)

  if (matrix.data && matrix.data !== source) {
    setSource(matrix.data)
    setDraft(Object.fromEntries(matrix.data.roles.map((role) => [role.name, role.permissions])))
  }

  const save = useMutation({
    mutationFn: () => saveMatrix(draft),
    onSuccess: (data) => {
      queryClient.setQueryData(['hr-roles'], data.data)
      toast.push({ tone: 'success', message: 'Permissions saved. They apply at each user’s next request.' })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  if (matrix.isLoading) return <Skeleton className="h-96" />
  if (matrix.isError) return <ErrorState onRetry={() => matrix.refetch()} />
  if (!draft) return null

  const roles = matrix.data.roles
  const toggle = (role, permission) => setDraft((current) => ({
    ...current,
    [role]: current[role].includes(permission) ? current[role].filter((item) => item !== permission) : [...current[role], permission],
  }))

  return (
    <Card className="flex flex-col gap-4 overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <caption className="mb-3 text-left text-muted">Admin always has every permission. Change what the HR role can do.</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Permission</th>
            {roles.map((role) => <th key={role.name} scope="col" className="w-24 py-2 text-center font-medium">{role.name} {role.locked ? <LockClosedIcon className="inline h-3.5 w-3.5" aria-label="Locked" /> : null}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.data.permissions.map((permission) => (
            <tr key={permission.name} className="border-b border-border/60 last:border-0">
              <th scope="row" className="py-2.5 pr-4 text-left font-normal text-text">{labels[permission.name] ?? permission.name}</th>
              {roles.map((role) => (
                <td key={role.name} className="text-center">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500 disabled:opacity-60"
                    aria-label={`${role.name}: ${labels[permission.name] ?? permission.name}`}
                    checked={role.locked || draft[role.name]?.includes(permission.name)}
                    disabled={role.locked}
                    onChange={() => toggle(role.name, permission.name)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end"><Button loading={save.isPending} onClick={() => save.mutate()}>Save permissions</Button></div>
    </Card>
  )
}

import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@shared/ui/Card'
import { Tabs } from '@shared/ui/Tabs'
import { useAuth } from '../auth/AuthProvider'
import { ListsPanel } from './ListsPanel'
import { RolesPanel } from './RolesPanel'
import { SystemPanel } from './SystemPanel'
import { UsersPanel } from './UsersPanel'

export function SettingsPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const can = (permission) => user?.permissions?.includes(permission)
  const tabs = [
    ...(can('settings.users') ? [{ id: 'users', label: 'HR users' }, { id: 'roles', label: 'Roles & permissions' }] : []),
    ...(can('settings.lists') ? [{ id: 'lists', label: 'Departments, teams & skills' }] : []),
    ...(can('settings.users') ? [{ id: 'system', label: 'System health' }] : []),
  ]
  const tab = tabs.some((item) => item.id === params.get('tab')) ? params.get('tab') : tabs[0]?.id

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="HR users, permissions, lists and system status." />
      <Tabs items={tabs} value={tab ?? ''} onChange={(next) => setParams({ tab: next }, { replace: true })} label="Settings sections" />
      {tab === 'users' ? <UsersPanel /> : null}
      {tab === 'roles' ? <RolesPanel /> : null}
      {tab === 'lists' ? <ListsPanel /> : null}
      {tab === 'system' ? <SystemPanel /> : null}
    </div>
  )
}

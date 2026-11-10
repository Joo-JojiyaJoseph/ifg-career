import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@shared/ui/Card'
import { BuildingOffice2Icon, HeartIcon, KeyIcon, Squares2X2Icon, UsersIcon } from '@heroicons/react/24/outline'
import { SectionNav } from '@shared/ui/SectionNav'
import { useAuth } from '../auth/AuthProvider'
import { CompaniesPanel } from './CompaniesPanel'
import { ListsPanel } from './ListsPanel'
import { RolesPanel } from './RolesPanel'
import { SystemPanel } from './SystemPanel'
import { UsersPanel } from './UsersPanel'

export function SettingsPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const can = (permission) => user?.permissions?.includes(permission)
  const tabs = [
    ...(can('settings.users') ? [{ id: 'users', label: 'HR users', icon: UsersIcon, hint: 'Invite and manage access' }, { id: 'roles', label: 'Roles & permissions', icon: KeyIcon, hint: 'What each role can do' }] : []),
    ...(can('entities.manage') ? [{ id: 'companies', label: 'Companies', icon: BuildingOffice2Icon, hint: 'Logos, photos and details' }] : []),
    ...(can('settings.lists') ? [{ id: 'lists', label: 'Departments, teams & skills', icon: Squares2X2Icon, hint: 'Lists used in jobs' }] : []),
    ...(can('settings.users') ? [{ id: 'system', label: 'System health', icon: HeartIcon, hint: 'Integrations and uploads' }] : []),
  ]
  const tab = tabs.some((item) => item.id === params.get('tab')) ? params.get('tab') : tabs[0]?.id

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="HR users, permissions, companies, lists and system status." />
      <SectionNav items={tabs} value={tab ?? ''} onChange={(next) => setParams({ tab: next }, { replace: true })} label="Settings sections">
        {tab === 'users' ? <UsersPanel /> : null}
        {tab === 'roles' ? <RolesPanel /> : null}
        {tab === 'companies' ? <CompaniesPanel /> : null}
        {tab === 'lists' ? <ListsPanel /> : null}
        {tab === 'system' ? <SystemPanel /> : null}
      </SectionNav>
    </div>
  )
}

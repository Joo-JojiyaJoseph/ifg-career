import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bars3Icon,
  BellIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { PageTransition } from '@shared/ui/Motion'
import { SlideOver } from '@shared/ui/Modal'
import { BuildingTeamsIllustration } from '@shared/ui/illustrations/BuildingTeams'
import { useAuth } from '../features/auth/AuthProvider'

const items = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/jobs', label: 'Jobs', icon: BriefcaseIcon },
  { to: '/candidates', label: 'Candidates', icon: UsersIcon },
  { to: '/applications', label: 'Applications', icon: DocumentTextIcon },
  { to: '/interviews', label: 'Interviews', icon: CalendarDaysIcon },
  { to: '/talent', label: 'Talent Community', icon: MegaphoneIcon },
  { to: '/content', label: 'Website Content', icon: PaintBrushIcon },
  { to: '/reports', label: 'Reports', icon: ChartBarIcon },
]

export function PortalLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = [
    ...items,
    ...(user?.permissions?.includes('settings.users') ? [{ to: '/settings', label: 'Settings', icon: Cog6ToothIcon }] : []),
    ...(user?.permissions?.includes('audit.view') ? [{ to: '/audit', label: 'Audit Log', icon: ShieldCheckIcon }] : []),
  ]

  async function signOut() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-brand-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-b from-brand-700 to-brand-900 text-white lg:flex lg:flex-col">
        <SidebarBody items={nav} />
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center gap-3 px-4 py-4">
          <button type="button" className="min-h-11 min-w-11 rounded-full bg-white shadow-card lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Bars3Icon className="mx-auto h-6 w-6 text-brand-700" />
          </button>
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-white px-4 shadow-card">
            <MagnifyingGlassIcon className="h-5 w-5 text-muted" aria-hidden="true" />
            <span className="sr-only">Search</span>
            <input className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0" placeholder="Search candidates, jobs, applications" />
          </label>
          <button type="button" className="relative min-h-11 min-w-11 rounded-full bg-white shadow-card" aria-label="Notifications">
            <BellIcon className="mx-auto h-5 w-5 text-brand-700" />
          </button>
          <Menu as="div" className="relative">
            <MenuButton className="flex min-h-11 items-center gap-2 rounded-full bg-white px-2 pr-3 shadow-card">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{user?.initials}</span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium">{user?.name}</span>
                <span className="block text-xs text-muted">{user?.role}</span>
              </span>
              <ChevronDownIcon className="h-4 w-4 text-muted" />
            </MenuButton>
            <MenuItems className="absolute right-0 z-20 mt-2 w-48 rounded-xl bg-white p-1 shadow-card">
              <MenuItem>
                <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm data-[focus]:bg-brand-50" onClick={signOut}>
                  Sign out
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        </header>
        <main className="flex-1 px-4 pb-10">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <SlideOver open={open} onClose={() => setOpen(false)} title="Infolks Group">
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)} className="min-h-11 rounded-xl px-3 py-2 text-navy">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SlideOver>
    </div>
  )
}

function SidebarBody({ items }) {
  return (
    <>
      <div className="px-5 pb-4 pt-6">
        <p className="font-display text-lg font-semibold">Infolks Group</p>
        <p className="text-xs text-white/70">HR portal</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-full px-3 text-sm ${isActive ? 'bg-brand-500/90 shadow-glow' : 'hover:bg-white/10'}`
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-6">
        <BuildingTeamsIllustration className="h-16 w-full" />
        <p className="text-center text-xs text-white/80">Building Great Teams Together</p>
      </div>
    </>
  )
}

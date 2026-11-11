import PropTypes from 'prop-types'
import { Fragment, useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bars3Icon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  MegaphoneIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Aurora } from '@shared/ui/Aurora'
import { GroupLogo } from '@shared/ui/BrandLogo'
import { PageTransition } from '@shared/ui/Motion'
import { SlideOver } from '@shared/ui/Modal'
import { BuildingTeamsIllustration } from '@shared/ui/illustrations/BuildingTeams'
import { NotificationBell } from '@shared/ui/NotificationBell'
import { useAuth } from '../features/auth/AuthProvider'
import { useNotifications } from '../features/notifications/useNotifications'
import { GlobalSearch } from '../features/search/GlobalSearch'

const items = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/jobs', label: 'Jobs', icon: BriefcaseIcon, group: 'Hiring' },
  { to: '/candidates', label: 'Candidates', icon: UsersIcon, group: 'Hiring' },
  { to: '/applications', label: 'Applications', icon: DocumentTextIcon, group: 'Hiring' },
  { to: '/interviews', label: 'Interviews', icon: CalendarDaysIcon, group: 'Hiring' },
  { to: '/talent', label: 'Talent Community', icon: MegaphoneIcon, group: 'Engagement' },
  { to: '/content', label: 'Website Content', icon: PaintBrushIcon, group: 'Engagement' },
  { to: '/reports', label: 'Reports', icon: ChartBarIcon, group: 'Engagement' },
]

export function PortalLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const bell = useNotifications()
  const nav = [
    ...items,
    ...(user?.permissions?.includes('settings.users') || user?.permissions?.includes('settings.lists')
      ? [{ to: '/settings', label: 'Settings', icon: Cog6ToothIcon, group: 'Admin' }]
      : []),
    ...(user?.permissions?.includes('audit.view')
      ? [{ to: '/audit', label: 'Audit Log', icon: ShieldCheckIcon, group: 'Admin' }]
      : []),
  ]

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function signOut() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="relative isolate min-h-dvh bg-brand-50 md:grid md:grid-cols-[5.25rem_minmax(0,1fr)] lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <Aurora tone="light" />
      </div>
      {/* Tablets get a slim icon rail; laptops and up get the full sidebar. Phones use the bottom tab bar. */}
      <aside className="relative isolate hidden overflow-hidden bg-ink text-white md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        <Aurora tone="dark" className="opacity-60" />
        <SidebarBody items={nav} />
      </aside>
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header
          className={`sticky top-0 z-30 flex items-center gap-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 xl:px-8 transition duration-200 sm:gap-3 sm:py-4 ${scrolled ? 'border-b border-white/60 bg-white/70 shadow-glass backdrop-blur-xl backdrop-saturate-150' : 'border-b border-transparent'}`}
        >
          <button
            type="button"
            className="glass min-h-11 min-w-11 shrink-0 rounded-full md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Bars3Icon className="mx-auto h-6 w-6 text-brand-700" />
          </button>
          <GlobalSearch />
          <NotificationBell
            count={bell.count}
            items={bell.items}
            onSelect={bell.open}
            onMarkAll={bell.markAll}
            footer={
              <NavLink
                to="/notifications"
                className="flex min-h-11 items-center justify-center rounded-xl text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                See all notifications
              </NavLink>
            }
          />
          <Menu as="div" className="relative">
            <MenuButton
              className="glass flex min-h-11 shrink-0 items-center gap-2 rounded-full px-1.5 transition duration-200 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:px-2 sm:pr-3"
              aria-label="Account menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-semibold text-white">
                {user?.initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium">{user?.name}</span>
                <span className="block text-xs text-muted">{user?.role}</span>
              </span>
              <ChevronDownIcon className="hidden h-4 w-4 text-muted sm:block" />
            </MenuButton>
            <MenuItems
              transition
              anchor={{ to: 'bottom end', gap: 10, padding: 12 }}
              className="z-[70] w-60 origin-top-right rounded-2xl border border-border bg-white p-1.5 shadow-lift ring-1 ring-black/5 transition duration-150 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              <MenuItem>
                <NavLink
                  to="/notifications"
                  className="block min-h-11 w-full rounded-lg px-3 py-2.5 text-left text-sm data-[focus]:bg-brand-50"
                >
                  Notifications
                </NavLink>
              </MenuItem>
              <MenuItem>
                <NavLink
                  to="/account/notifications"
                  className="block min-h-11 w-full rounded-lg px-3 py-2.5 text-left text-sm data-[focus]:bg-brand-50"
                >
                  Notification preferences
                </NavLink>
              </MenuItem>
              <MenuItem>
                <button
                  type="button"
                  className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm data-[focus]:bg-brand-50"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        </header>
        <main className="mx-auto w-full max-w-[100rem] flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 md:pb-10 xl:px-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <SlideOver open={open} onClose={() => setOpen(false)} title="Infolks Group">
        <nav className="flex flex-col gap-1">
          {nav.map((item, index) => (
            <Fragment key={item.to}>
              {item.group && item.group !== nav[index - 1]?.group ? (
                <p className="mb-1 mt-3 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {item.group}
                </p>
              ) : null}
              <NavLink
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition duration-200 ${isActive ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow' : 'text-navy hover:bg-brand-50'}`
                }
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            </Fragment>
          ))}
        </nav>
      </SlideOver>
      <BottomTabs items={nav} onMore={() => setOpen(true)} />
    </div>
  )
}

const tabPaths = ['/', '/jobs', '/candidates', '/interviews']

/** Phones only: the four most used sections plus "More" (opens the full menu), like a native app. */
function BottomTabs({ items, onMore }) {
  const tabs = tabPaths.map((path) => items.find((item) => item.to === path)).filter(Boolean)
  const short = { 'Talent Community': 'Talent', 'Website Content': 'Content' }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgba(7,28,62,0.18)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
      aria-label="Main sections"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {tabs.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${isActive ? 'text-brand-700' : 'text-muted hover:text-navy'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-full transition duration-200 ${isActive ? 'bg-brand-100 scale-100' : 'scale-95'}`}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {short[item.label] ?? item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex-1">
          <button
            type="button"
            onClick={onMore}
            className="flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium text-muted transition duration-200 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span className="flex h-8 w-14 items-center justify-center rounded-full">
              <EllipsisHorizontalIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            More
          </button>
        </li>
      </ul>
    </nav>
  )
}

BottomTabs.propTypes = { items: PropTypes.array.isRequired, onMore: PropTypes.func.isRequired }

function SidebarBody({ items }) {
  return (
    <>
      <div className="flex flex-col items-center px-3 pb-6 pt-6 lg:items-start lg:px-5">
        <span className="lg:hidden" title="Infolks Group HR portal">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900 font-display text-sm font-semibold shadow-glow">
            IG
          </span>
        </span>
        <span className="hidden lg:block">
          <GroupLogo tone="dark" />
        </span>
        <p className="mt-2 hidden text-xs font-medium uppercase tracking-[0.14em] text-white/50 lg:block">HR portal</p>
      </div>
      <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 lg:px-3" aria-label="Portal">
        {items.map((item, index) => (
          <Fragment key={item.to}>
            {item.group && item.group !== items[index - 1]?.group ? (
              <p className="mb-1 mt-4 hidden px-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/40 lg:block">
                {item.group}
              </p>
            ) : null}
            <NavLink
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                `group relative flex min-h-12 items-center justify-center gap-3 rounded-xl px-3 text-sm transition lg:min-h-11 lg:justify-start duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${isActive ? 'glass-dark border font-semibold' : 'text-white/75 hover:bg-white/[0.06] hover:text-white'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan to-brand-500 transition duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden="true"
                  />
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition duration-200 ${isActive ? 'text-cyan-200' : 'group-hover:scale-110'}`}
                    aria-hidden="true"
                  />
                  <span className="sr-only lg:not-sr-only">{item.label}</span>
                </>
              )}
            </NavLink>
          </Fragment>
        ))}
      </nav>
      <div className="glass-dark mx-4 mb-5 mt-4 hidden rounded-2xl border px-3 pb-3 pt-2 lg:block">
        <BuildingTeamsIllustration className="h-16 w-full" />
        <p className="text-center text-xs text-white/75">Building Great Teams Together</p>
      </div>
    </>
  )
}

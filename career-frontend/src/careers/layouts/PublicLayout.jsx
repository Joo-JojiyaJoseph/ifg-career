import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { Banner } from '@shared/ui/Banner'
import { Button } from '@shared/ui/Button'
import { PageTransition } from '@shared/ui/Motion'
import { SlideOver } from '@shared/ui/Modal'
import { startGoogleSignIn } from '../features/auth/api'
import { useCandidateAuth } from '../features/auth/AuthProvider'

export function PublicLayout() {
  const { candidate, logout } = useCandidateAuth()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('profile-banner-dismissed') === '1')
  const showBanner = Boolean(candidate && !candidate.profile_completed_at && !dismissed)

  function dismissBanner() {
    sessionStorage.setItem('profile-banner-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="font-display text-lg text-navy">
            Infolks Group <span className="text-muted">Careers</span>
          </Link>
          <nav className="hidden items-center gap-3 md:flex">
            <NavLinks candidate={candidate} logout={logout} />
          </nav>
          <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Bars3Icon className="h-6 w-6 text-brand-700" />
          </button>
        </div>
      </header>
      {showBanner ? (
        <Banner onDismiss={dismissBanner}>
          Finish your profile so hiring teams can review it. <Link className="underline" to="/profile">Complete your profile</Link>
        </Banner>
      ) : null}
      <SlideOver open={open} onClose={() => setOpen(false)} title="Infolks Group Careers">
        <nav className="flex flex-col gap-2">
          <NavLinks candidate={candidate} logout={logout} stacked onNavigate={() => setOpen(false)} />
        </nav>
      </SlideOver>
      <main id="content">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}

function NavLinks({ candidate, logout, stacked = false, onNavigate }) {
  const linkClass = stacked ? 'flex min-h-11 items-center rounded-xl px-3 text-brand-700' : 'min-h-11 px-2 py-3 text-sm text-brand-700'

  return (
    <>
      <Link className={linkClass} to="/jobs" onClick={onNavigate}>Job Search</Link>
      <Link className={linkClass} to="/jobs?level=internship" onClick={onNavigate}>Internship</Link>
      <Link className={linkClass} to="/#quick-apply" onClick={onNavigate}>Quick apply</Link>
      {candidate && stacked ? (
        <>
          <Link className={linkClass} to="/profile" onClick={onNavigate}>My Profile</Link>
          <Link className={linkClass} to="/my-applications" onClick={onNavigate}>My Applications</Link>
          <Link className={linkClass} to="/settings/notifications" onClick={onNavigate}>Notifications</Link>
          <button type="button" className={linkClass} onClick={() => { onNavigate?.(); logout() }}>Sign out</button>
        </>
      ) : null}
      {candidate && !stacked ? (
        <Menu as="div" className="relative">
          <MenuButton className="min-h-11 rounded-full bg-brand-600 px-4 text-sm text-white">{candidate.initials || candidate.name}</MenuButton>
          <MenuItems className="absolute right-0 z-40 mt-2 w-48 rounded-xl bg-white p-1 shadow-card">
            <MenuItem>
              <Link className="block rounded-lg px-3 py-2 text-sm data-[focus]:bg-brand-50" to="/profile" onClick={onNavigate}>
                My Profile
              </Link>
            </MenuItem>
            <MenuItem>
              <Link className="block rounded-lg px-3 py-2 text-sm data-[focus]:bg-brand-50" to="/my-applications" onClick={onNavigate}>
                My Applications
              </Link>
            </MenuItem>
            <MenuItem>
              <Link className="block rounded-lg px-3 py-2 text-sm data-[focus]:bg-brand-50" to="/settings/notifications" onClick={onNavigate}>
                Notifications
              </Link>
            </MenuItem>
            <MenuItem>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm data-[focus]:bg-brand-50" onClick={() => { onNavigate?.(); logout() }}>
                Sign out
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      ) : null}
      {!candidate ? <Button onClick={() => { onNavigate?.(); startGoogleSignIn() }}>Sign in</Button> : null}
    </>
  )
}

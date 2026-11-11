import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { AcademicCapIcon, ArrowRightStartOnRectangleIcon, Bars3Icon, BellIcon, BriefcaseIcon, DocumentTextIcon, HomeIcon, MagnifyingGlassIcon, PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { BackToTop } from '@shared/ui/BackToTop'
import { Banner } from '@shared/ui/Banner'
import { Button } from '@shared/ui/Button'
import { GroupLogo } from '@shared/ui/BrandLogo'
import { PageTransition } from '@shared/ui/Motion'
import { ScrollProgress } from '@shared/ui/ScrollProgress'
import { SlideOver } from '@shared/ui/Modal'
import { startGoogleSignIn } from '../features/auth/api'
import { useCandidateAuth } from '../features/auth/AuthProvider'
import { contentQuery } from '../features/landing/api'
import { FloatingActions } from '../features/landing/FloatingActions'
import { SiteFooter } from '../features/landing/SiteFooter'
import { QuickApplyProvider } from '../features/apply/QuickApplyDialog'
import { useQuickApply } from '../features/apply/quickApplyContext'

export function PublicLayout() {
  const { candidate, logout } = useCandidateAuth()
  const { pathname } = useLocation()
  const content = useQuery(contentQuery)
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('profile-banner-dismissed') === '1')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const showBanner = Boolean(candidate && !candidate.profile_completed_at && !dismissed)
  // A solid white header on every page; it gains a soft shadow once you scroll.
  const home = pathname === '/'
  const overHero = false

  function dismissBanner() {
    sessionStorage.setItem('profile-banner-dismissed', '1')
    setDismissed(true)
  }

  return (
    <QuickApplyProvider>
      <div className="flex min-h-screen flex-col bg-brand-50">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <ScrollProgress />
        <FloatingActions home={home} />
        <header className={`sticky top-0 z-30 border-b [view-transition-name:site-header] transition duration-300 ${overHero ? 'border-transparent bg-transparent' : `backdrop-blur-xl backdrop-saturate-150 ${scrolled ? 'border-white/60 bg-white/75 shadow-glass' : 'border-transparent bg-white/95'}`}`}>
          <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-4 2xl:max-w-7xl">
            <Link to="/" viewTransition className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Infolks Group Careers home">
              <GroupLogo suffix="Careers" tone={overHero ? 'dark' : 'light'} />
            </Link>
            <nav className="hidden items-center gap-1 lg:flex xl:gap-3">
              <NavLinks candidate={candidate} logout={logout} dark={overHero} />
            </nav>
            <div className="flex items-center gap-1 lg:hidden">
              <Link to="/my-applications" viewTransition className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition duration-200 ${overHero ? 'text-white hover:bg-white/15' : 'text-brand-700 hover:bg-brand-100/60'}`} aria-label="Candidate profile">
                <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
              </Link>
              <Link to="/jobs" viewTransition className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition duration-200 ${overHero ? 'text-white hover:bg-white/15' : 'text-brand-700 hover:bg-brand-100/60'}`} aria-label="Search jobs">
                <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
              </Link>
              <button type="button" className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition duration-200 ${overHero ? 'glass-dark text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`} aria-label="Open menu" onClick={() => setOpen(true)}>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>
        {showBanner ? (
          <div>
            <Banner onDismiss={dismissBanner}>
              Finish your profile so hiring teams can review it. <Link className="underline" to="/profile">Complete your profile</Link>
            </Banner>
          </div>
        ) : null}
        <SlideOver open={open} onClose={() => setOpen(false)} title="Infolks Group Careers">
          <nav className="flex flex-col gap-2">
            <NavLinks candidate={candidate} logout={logout} stacked onNavigate={() => setOpen(false)} />
          </nav>
        </SlideOver>
        <main id="content" className="flex-1">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <BackToTop />
        <SiteFooter footer={content.data?.footer} social={content.data?.social_links ?? []} entities={content.data?.entities ?? []} />
      </div>
    </QuickApplyProvider>
  )
}

function MenuIcon({ icon: Icon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true">
      <Icon className="h-5 w-5" />
    </span>
  )
}

MenuIcon.propTypes = { icon: PropTypes.elementType.isRequired }

function NavLinks({ candidate, logout, stacked = false, dark = false, onNavigate }) {
  const { openQuickApply } = useQuickApply()
  const linkClass = stacked
    ? 'flex min-h-14 items-center gap-3 rounded-2xl px-3 text-base font-medium text-ink transition duration-200 hover:bg-brand-50 active:scale-[0.99]'
    : `inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition xl:px-4 duration-200 ${dark ? 'text-white/90 hover:bg-white/15 hover:text-white' : 'text-navy hover:bg-brand-100/60 hover:text-brand-700'}`

  return (
    <>
      <Link className={linkClass} to="/" viewTransition onClick={onNavigate}>{stacked ? <MenuIcon icon={HomeIcon} /> : null}Careers</Link>
      <Link className={linkClass} to="/jobs" viewTransition onClick={onNavigate}>{stacked ? <MenuIcon icon={BriefcaseIcon} /> : null}Job Search</Link>
      <Link className={linkClass} to="/jobs?level=internship" viewTransition onClick={onNavigate}>{stacked ? <MenuIcon icon={AcademicCapIcon} /> : null}Internship</Link>
      {stacked ? <a className={linkClass} href="/#quick-apply" onClick={(event) => { onNavigate?.(); openQuickApply(event) }}><MenuIcon icon={PaperAirplaneIcon} />Quick apply</a> : null}
      {/* Candidate profile: the candidate's applications and their status. Guests are asked to sign in there. */}
      {stacked ? (
        <Link className={linkClass} to="/my-applications" onClick={onNavigate}><MenuIcon icon={DocumentTextIcon} />Candidate profile</Link>
      ) : (
        <Link
          to="/my-applications"
          viewTransition
          className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 ${dark ? 'glass-dark text-white' : 'border border-brand-200 bg-white/80 text-brand-700 hover:bg-brand-50'}`}
        >
          <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
          Candidate profile
        </Link>
      )}
      {candidate && stacked ? (
        <>
          <Link className={linkClass} to="/profile" onClick={onNavigate}><MenuIcon icon={UserCircleIcon} />My Profile</Link>
          <Link className={linkClass} to="/settings/notifications" onClick={onNavigate}><MenuIcon icon={BellIcon} />Notifications</Link>
          <button type="button" className={linkClass} onClick={() => { onNavigate?.(); logout() }}>Sign out</button>
        </>
      ) : null}
      {candidate && !stacked ? (
        <Menu as="div" className="relative">
          <MenuButton className="min-h-11 min-w-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 px-4 text-sm font-semibold text-white shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">{candidate.initials || candidate.name}</MenuButton>
          {/* Rendered above the whole page (not inside the header) on a solid background, so nothing shows through. */}
          <MenuItems
            anchor={{ to: 'bottom end', gap: 10, padding: 12 }}
            transition
            className="z-[70] w-64 origin-top-right rounded-2xl border border-border bg-white p-1.5 shadow-lift ring-1 ring-black/5 transition duration-150 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="flex items-center gap-3 px-3 pb-3 pt-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white" aria-hidden="true">{candidate.initials}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{candidate.name}</span>
                {candidate.email ? <span className="block truncate text-xs text-muted">{candidate.email}</span> : null}
              </span>
            </div>
            <div className="border-t border-border pt-1.5">
              {[
                { to: '/profile', label: 'My Profile', icon: UserCircleIcon },
                { to: '/my-applications', label: 'My Applications', icon: DocumentTextIcon },
                { to: '/settings/notifications', label: 'Notifications', icon: BellIcon },
              ].map((item) => (
                <MenuItem key={item.to}>
                  <Link className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink transition data-[focus]:bg-brand-50 data-[focus]:text-brand-700" to={item.to} onClick={onNavigate}>
                    <item.icon className="h-5 w-5 text-muted" aria-hidden="true" />
                    {item.label}
                  </Link>
                </MenuItem>
              ))}
            </div>
            <div className="mt-1.5 border-t border-border pt-1.5">
              <MenuItem>
                <button type="button" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-danger transition data-[focus]:bg-red-50" onClick={() => { onNavigate?.(); logout() }}>
                  <ArrowRightStartOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                  Sign out
                </button>
              </MenuItem>
            </div>
          </MenuItems>
        </Menu>
      ) : null}
      {!candidate ? <Button onClick={() => { onNavigate?.(); startGoogleSignIn() }}>Sign in</Button> : null}
    </>
  )
}

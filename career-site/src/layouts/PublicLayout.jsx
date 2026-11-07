import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { AcademicCapIcon, Bars3Icon, BellIcon, BriefcaseIcon, DocumentTextIcon, HomeIcon, MagnifyingGlassIcon, PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { BackToTop } from '@shared/ui/BackToTop'
import { Banner } from '@shared/ui/Banner'
import { Button } from '@shared/ui/Button'
import { GroupLogo } from '@shared/ui/BrandLogo'
import { PageTransition } from '@shared/ui/Motion'
import { ScrollProgress } from '@shared/ui/ScrollProgress'
import { SlideOver } from '@shared/ui/Modal'
import { startGoogleSignIn } from '../features/auth/api'
import { useCandidateAuth } from '../features/auth/AuthProvider'
import { contentQuery, culturePhotos, isPlaceholder } from '../features/landing/api'
import { SiteFooter } from '../features/landing/SiteFooter'

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
  // On the home page the header floats over the hero photo, and turns into frosted white glass once you scroll.
  const home = pathname === '/'
  const overHero = home && !scrolled && !open
  const photos = culturePhotos(content.data)
  const footerPhoto = photos.at(-1)?.photo_url ?? (isPlaceholder(content.data?.hero?.banner_image) ? null : content.data?.hero?.banner_image)

  function dismissBanner() {
    sessionStorage.setItem('profile-banner-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-50">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <ScrollProgress />
      <header className={`${home ? 'fixed inset-x-0' : 'sticky'} top-0 z-30 border-b [view-transition-name:site-header] transition duration-300 ${overHero ? 'border-transparent bg-transparent' : `backdrop-blur-xl backdrop-saturate-150 ${scrolled ? 'border-white/60 bg-white/75 shadow-glass' : 'border-transparent bg-white/95'}`}`}>
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-4 2xl:max-w-7xl">
          <Link to="/" viewTransition className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Infolks Group Careers home">
            <GroupLogo suffix="Careers" tone={overHero ? 'dark' : 'light'} />
          </Link>
          <nav className="hidden items-center gap-3 md:flex">
            <NavLinks candidate={candidate} logout={logout} dark={overHero} />
          </nav>
          <div className="flex items-center gap-1 md:hidden">
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
        <div className={home ? 'bg-ink pt-16' : ''}>
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
      <SiteFooter footer={content.data?.footer} social={content.data?.social_links ?? []} photo={footerPhoto} />
    </div>
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
  const linkClass = stacked
    ? 'flex min-h-14 items-center gap-3 rounded-2xl px-3 text-base font-medium text-ink transition duration-200 hover:bg-brand-50 active:scale-[0.99]'
    : `inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition duration-200 ${dark ? 'text-white/90 hover:bg-white/15 hover:text-white' : 'text-navy hover:bg-brand-100/60 hover:text-brand-700'}`

  return (
    <>
      <Link className={linkClass} to="/" viewTransition onClick={onNavigate}>{stacked ? <MenuIcon icon={HomeIcon} /> : null}Careers</Link>
      <Link className={linkClass} to="/jobs" viewTransition onClick={onNavigate}>{stacked ? <MenuIcon icon={BriefcaseIcon} /> : null}Job Search</Link>
      <Link className={linkClass} to="/jobs?level=internship" viewTransition onClick={onNavigate}>{stacked ? <MenuIcon icon={AcademicCapIcon} /> : null}Internship</Link>
      {stacked ? <a className={linkClass} href="/#quick-apply" onClick={onNavigate}><MenuIcon icon={PaperAirplaneIcon} />Quick apply</a> : null}
      {/* Candidate profile: the candidate's applications and their status. Guests are asked to sign in there. */}
      {stacked ? (
        <Link className={linkClass} to="/my-applications" onClick={onNavigate}><MenuIcon icon={DocumentTextIcon} />Candidate profile</Link>
      ) : (
        <Link
          to="/my-applications"
          viewTransition
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 ${dark ? 'glass-dark text-white' : 'border border-brand-200 bg-white/80 text-brand-700 hover:bg-brand-50'}`}
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
          <MenuItems transition className="glass absolute right-0 z-40 mt-2 w-52 origin-top-right rounded-2xl p-1.5 transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0">
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

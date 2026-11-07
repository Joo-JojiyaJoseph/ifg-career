import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { m } from 'framer-motion'
import { CalendarDaysIcon, InboxStackIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { Aurora } from '@shared/ui/Aurora'
import { GroupLogo } from '@shared/ui/BrandLogo'
import { WordReveal } from '@shared/ui/WordReveal'
import { client } from '@shared/api/createClient'
import { Photo } from '@shared/ui/Photo'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'

const entities = ['Infolks', 'Webfolks', 'Dataways', 'Medrays']
const careersUrl = import.meta.env.VITE_CAREERS_URL ?? '/'

const features = [
  { icon: InboxStackIcon, title: 'Every application in one place', text: 'Job applications and Quick apply, reviewed by entity.' },
  { icon: CalendarDaysIcon, title: 'Interviews in sync', text: 'Schedule rounds and keep the HR calendar up to date.' },
  { icon: UserGroupIcon, title: 'A talent community', text: 'Job alerts and company updates for future hires.' },
]

/** The careers page photos (banner and culture photos), so the sign-in screen matches the site HR manages. */
async function fetchSitePhotos() {
  const { data } = await client.get('/api/v1/public/content')
  const content = data.data ?? {}
  const usable = (url) => url && !url.includes('/placeholders/')
  return {
    background: usable(content.hero?.banner_image) ? content.hero.banner_image : null,
    culture: (content.media ?? []).filter((item) => item.type === 'activity' && usable(item.photo_url)).slice(0, 2),
  }
}

/**
 * Sign-in, password reset and two-factor screens.
 * One centred composition: brand row, the story beside a frosted card, and a footer row, all inside the same
 * container so nothing drifts to the screen edges on wide monitors. Phones and tablets show the brand, one line
 * and the card.
 */
export function AuthLayout() {
  const reduced = usePrefersReducedMotion()
  const photos = useQuery({ queryKey: ['auth-site-photos'], queryFn: fetchSitePhotos, staleTime: 3_600_000, retry: false })
  const culture = photos.data?.culture ?? []
  const rise = (delay = 0) => (reduced ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } })

  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-ink text-white">
      <Photo src={photos.data?.background} alt="" priority className="!absolute inset-0 -z-20" imgClassName="motion-safe:animate-ken-burns" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/60" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-transparent to-ink/40" aria-hidden="true" />
      <Aurora tone="dark" className="opacity-60" />

      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-2 sm:py-4">
          <GroupLogo tone="dark" suffix="HR Portal" />
          <a href={careersUrl} className="hidden min-h-11 items-center rounded-full border border-white/15 px-4 text-sm font-medium text-white/80 transition duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex">
            Careers site
          </a>
        </header>

        <main className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-16 xl:gap-24">
          <section className="hidden lg:block" aria-label="About the HR portal">
            <m.p {...rise(0)} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
              HR Portal
            </m.p>
            <WordReveal as="h1" text="Hire great people across Infolks Group" delay={0.05} className="mt-5 max-w-xl font-display text-[clamp(2.4rem,2.2vw+1.4rem,3.5rem)] font-semibold leading-[1.08] tracking-tight" />
            <m.p {...rise(0.35)} className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">
              One private workspace for the people who hire at Infolks, Webfolks, Dataways and Medrays.
            </m.p>
            <m.ul {...rise(0.45)} className="mt-9 grid max-w-xl gap-4">
              {features.map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] text-cyan-200 backdrop-blur" aria-hidden="true">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-white">{item.title}</span>
                    <span className="block text-sm text-white/60">{item.text}</span>
                  </span>
                </li>
              ))}
            </m.ul>
            {/* Team photos appear only when the screen is tall enough, so the page never needs to scroll on laptops. */}
            {culture.length ? (
              <m.div {...rise(0.55)} className="mt-10 hidden max-w-lg grid-cols-2 gap-4 [@media(min-height:900px)]:grid" aria-hidden="true">
                {culture.map((photo, index) => (
                  <figure key={photo.id} className={`glass-dark rounded-[1.5rem] p-1.5 ${index ? 'translate-y-6' : ''}`}>
                    <div className={`motion-safe:animate-float-slow ${index ? '[animation-delay:-8s]' : ''}`}>
                      <Photo src={photo.photo_url} className="aspect-[4/3] rounded-[1.15rem]" sizes="240px" />
                      <figcaption className="px-2 pb-1 pt-2 text-xs font-medium text-white/80">{photo.title}</figcaption>
                    </div>
                  </figure>
                ))}
              </m.div>
            ) : null}
          </section>

          <section className="mx-auto w-full max-w-md lg:max-w-none">
            <m.p {...rise(0)} className="mb-6 text-center font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:hidden">
              Hire great people across Infolks Group
            </m.p>
            <m.div {...rise(0.1)} className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/[0.95] text-text shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan via-brand-500 to-violet" aria-hidden="true" />
              <div className="p-6 sm:p-9">
                <Outlet />
              </div>
              <p className="flex items-center justify-center gap-2 border-t border-border/70 bg-brand-50/60 px-6 py-3.5 text-xs text-muted">
                <LockClosedIcon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                Private access for Infolks Group hiring teams
              </p>
            </m.div>
          </section>
        </main>

        <footer className="flex flex-col items-center gap-3 border-t border-white/10 pt-5 text-xs text-white/55 sm:flex-row sm:justify-between">
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Companies in the group">
            {entities.map((name) => (
              <li key={name} className="rounded-full border border-white/15 px-3 py-1 font-medium text-white/75">{name}</li>
            ))}
          </ul>
          <p>Building Great Teams Together · © {new Date().getFullYear()} Infolks Group</p>
        </footer>
      </div>
    </div>
  )
}

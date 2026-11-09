import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { m } from 'framer-motion'
import { AcademicCapIcon, ArrowRightIcon, BriefcaseIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'
import { heroJobsQuery } from '../jobs/api'

/**
 * Three big doors right under the hero, for the three things most visitors came to do.
 * They rise into place over the bottom of the hero photo.
 */
export function QuickPaths() {
  const reduced = usePrefersReducedMotion()
  const jobs = useQuery(heroJobsQuery)
  const total = jobs.data?.meta?.total
  const internships = jobs.data?.counts?.level?.internship

  const paths = [
    {
      to: '/jobs',
      icon: BriefcaseIcon,
      title: 'Search jobs',
      text: total ? `${total} open ${total === 1 ? 'role' : 'roles'} across the group` : 'Browse every open role',
      tint: 'from-brand-500 to-brand-700',
    },
    {
      to: '/jobs?level=internship',
      icon: AcademicCapIcon,
      title: 'Internships',
      text: internships ? `${internships} ${internships === 1 ? 'internship' : 'internships'} open now` : 'Start your career with us',
      tint: 'from-cyan to-teal',
    },
    {
      href: '#quick-apply',
      icon: PaperAirplaneIcon,
      title: 'Quick Apply',
      text: 'Not sure which role? Share your profile in a minute',
      tint: 'from-accent-orange to-amber',
    },
  ]

  return (
    <nav aria-label="Get started" className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:-mt-14 2xl:max-w-7xl">
      <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {paths.map((path, index) => {
          const body = (
            <>
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${path.tint} text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`} aria-hidden="true">
                <path.icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold text-ink">{path.title}</span>
                <span className="block text-sm text-muted">{path.text}</span>
              </span>
              <ArrowRightIcon className="h-5 w-5 shrink-0 text-brand-600 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </>
          )
          const className = 'group flex h-full min-h-[5.5rem] items-center gap-4 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lift backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:p-5'
          return (
            <m.li
              key={path.title}
              className="h-full"
              initial={reduced ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {path.to ? <Link to={path.to} viewTransition className={className}>{body}</Link> : <a href={path.href} className={className}>{body}</a>}
            </m.li>
          )
        })}
      </ul>
    </nav>
  )
}

import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { GroupLogo } from '@shared/ui/BrandLogo'
import { Reveal } from '@shared/ui/Motion'
import { SocialIcon } from './SocialIcon'

const DEFAULT_CLOSING = 'Every new person brings a new perspective, a new possibility, and another story to be part of. We look forward to discovering yours.'

const heading = 'flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200'
const link = 'group inline-flex min-h-11 items-center gap-2 rounded text-sm text-white/80 transition duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white'

/**
 * Section 7, on every careers page: the group's closing message, Quick Links (Careers, Job Search, Internship,
 * Contact Us), Social Media and the copyright line. Everything comes from HR's Website Content, with the career
 * page wording as the default.
 */
export function SiteFooter({ footer: setting, social = [] }) {
  const footer = setting ?? {}
  const year = new Date().getFullYear()

  const quickLinks = [
    { to: '/', label: 'Careers' },
    { to: '/jobs', label: 'Job Search' },
    { to: '/jobs?level=internship', label: 'Internship' },
    footer.contact_email ? { href: `mailto:${footer.contact_email}`, label: 'Contact Us' } : { href: '#footer', label: 'Contact Us' },
  ]

  return (
    <footer id="footer" className="relative isolate overflow-hidden bg-gradient-to-b from-navy to-ink text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-cyan/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 -z-10 h-72 w-[30rem] rounded-full bg-violet/20 blur-3xl" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-4 2xl:max-w-7xl">
        <Reveal className="grid items-start gap-10 py-12 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-x-20 md:py-14 lg:gap-x-28">
          <div className="max-w-md">
            <Link to="/" viewTransition className="flex min-h-11 items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Back to the careers home page">
              <GroupLogo tone="dark" />
            </Link>
            <p className="mt-4 font-display text-lg leading-relaxed text-white/90 [text-wrap:pretty]">{footer.closing_text || DEFAULT_CLOSING}</p>
          </div>

          <nav aria-label="Quick links">
            <h2 className={heading}>Quick Links</h2>
            <ul>
              {quickLinks.map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <Link className={link} to={item.to} viewTransition>{item.label}</Link>
                  ) : (
                    <a className={link} href={item.href}>{item.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {social.length ? (
            <div>
              <h2 className={heading}>Social Media</h2>
              <ul className="-ml-3 flex gap-3">
                {social.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${item.name} (opens in a new tab)`}
                      className="group flex w-[4.25rem] flex-col items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 transition duration-200 group-hover:-translate-y-0.5 group-hover:bg-white group-hover:text-ink">
                        <SocialIcon name={item.name} />
                      </span>
                      <span className="text-xs text-white/60 transition group-hover:text-white" aria-hidden="true">{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Reveal>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-white/60 sm:flex-row 2xl:max-w-7xl">
          <p>© {year} {footer.copyright ?? 'Infolks Group. All Rights Reserved.'}</p>
          <Link to="/privacy" viewTransition className="inline-flex min-h-11 items-center hover:text-white">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}

SiteFooter.propTypes = {
  footer: PropTypes.object,
  social: PropTypes.array,
}

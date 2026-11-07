import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { ArrowRightIcon, EnvelopeIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { GROUP } from '@shared/brand'
import { Aurora } from '@shared/ui/Aurora'
import { GroupLogo } from '@shared/ui/BrandLogo'
import { Photo } from '@shared/ui/Photo'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'
import { SocialIcon } from './SocialIcon'

/**
 * Section 7, on every careers page: a closing message over a photo (its heading is optional),
 * then Quick Links, Social Media and the copyright line.
 */
export function SiteFooter({ footer: setting, social = [], photo }) {
  const reduced = usePrefersReducedMotion()
  const footer = setting ?? {}
  const year = new Date().getFullYear()
  const linkClass = 'inline-flex min-h-11 items-center gap-2 rounded text-sm text-white/70 transition duration-200 hover:translate-x-0.5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white'
  const quickLinks = [
    { to: '/', label: 'Careers' },
    { to: '/jobs', label: 'Job Search' },
    { to: '/jobs?level=internship', label: 'Internship' },
    footer.contact_email ? { href: `mailto:${footer.contact_email}`, label: 'Contact Us' } : { href: '#footer-contact', label: 'Contact Us' },
  ]

  return (
    <footer className="relative isolate overflow-hidden bg-ink text-white">
      <div className="relative isolate overflow-hidden">
        <Photo src={photo} alt="" className="!absolute inset-0 -z-20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/80 to-ink" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28 2xl:max-w-7xl">
          <m.div
            className="glass-dark mx-auto max-w-3xl rounded-[2rem] px-6 py-10 text-center sm:px-12 sm:py-14"
            {...(reduced ? {} : { initial: { opacity: 0, y: 30, scale: 0.98 }, whileInView: { opacity: 1, y: 0, scale: 1 }, viewport: { once: true, amount: 0.4 }, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } })}
          >
            {footer.closing_title ? (
              <h2 className="mb-5 font-display text-[clamp(1.9rem,3vw+1rem,3.5rem)] font-semibold uppercase leading-[1.02] tracking-tight">{footer.closing_title}</h2>
            ) : null}
            {footer.closing_text ? <p className="mx-auto max-w-xl font-display text-lg leading-relaxed text-white/85 md:text-2xl">{footer.closing_text}</p> : null}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/jobs" viewTransition className="shine group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 font-semibold text-ink transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
                Job Search
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a href="/#quick-apply" className="glass-dark inline-flex min-h-12 items-center justify-center rounded-full px-7 font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.16] focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Quick Apply
              </a>
            </div>
          </m.div>
        </div>
      </div>

      <div className="relative isolate">
        <Aurora tone="dark" className="opacity-30" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr] 2xl:max-w-7xl">
          <div id="footer-contact" className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <GroupLogo tone="dark" className="self-start" />
            <p className="max-w-xs text-sm leading-relaxed text-white/70">{footer.tagline ?? GROUP.tagline}. Infolks, Medrays, Webfolks and Dataways.</p>
            <ul className="flex flex-col text-sm text-white/75">
              {footer.address ? <li className="flex items-start gap-2 py-2"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{footer.address}</li> : null}
              {footer.contact_email ? <li><a href={`mailto:${footer.contact_email}`} className={linkClass}><EnvelopeIcon className="h-4 w-4" aria-hidden="true" />{footer.contact_email}</a></li> : null}
              {footer.contact_phone ? <li><a href={`tel:${footer.contact_phone.replace(/\s/g, '')}`} className={linkClass}><PhoneIcon className="h-4 w-4" aria-hidden="true" />{footer.contact_phone}</a></li> : null}
            </ul>
          </div>

          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Quick Links</h2>
            <ul className="mt-3 flex flex-col">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  {item.to ? <Link className={linkClass} to={item.to} viewTransition>{item.label}</Link> : <a className={linkClass} href={item.href}>{item.label}</a>}
                </li>
              ))}
            </ul>
          </nav>

          {social.length ? (
            <div>
              <h2 id="footer-social" className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Social Media</h2>
              <ul className="mt-4 grid grid-cols-2 gap-2" aria-labelledby="footer-social">
                {social.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="glass-dark group flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <SocialIcon name={link.name} />
                      {link.name}
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-white/60 sm:flex-row 2xl:max-w-7xl">
            <p>© {year} {footer.copyright ?? 'Infolks Group. All Rights Reserved.'}</p>
            <Link to="/privacy" className="inline-flex min-h-11 items-center hover:text-white">Privacy policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

SiteFooter.propTypes = {
  footer: PropTypes.object,
  social: PropTypes.array,
  /** Background photo for the closing message. */
  photo: PropTypes.string,
}

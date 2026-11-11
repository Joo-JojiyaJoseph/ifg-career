import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { ArrowTopRightOnSquareIcon, EnvelopeIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { GROUP } from '@shared/brand'
import { EntityLogo, GroupLogo } from '@shared/ui/BrandLogo'
import { useQuickApply } from '../apply/quickApplyContext'
import { SocialIcon } from './SocialIcon'

const DEFAULT_CLOSING = 'Every new person brings a new perspective, a new possibility, and another story to be part of. We look forward to discovering yours.'
const host = (url) => url?.replace(/^https?:\/\//, '').replace(/\/$/, '')

/**
 * Section 7, on every careers page, in navy. The group with its closing message and contact details, the four
 * companies with links to their websites, the quick links and social media, and a thin copyright line.
 */
export function SiteFooter({ footer: setting, social = [], entities = [] }) {
  const { openQuickApply, openJobAlerts } = useQuickApply()
  const footer = setting ?? {}
  const year = new Date().getFullYear()
  const linkClass = 'inline-flex min-h-11 items-center rounded text-sm text-white/75 transition duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white'
  const links = [
    { to: '/', label: 'Careers' },
    { to: '/jobs', label: 'Job Search' },
    { to: '/jobs?level=internship', label: 'Internship' },
    { href: '/#quick-apply', label: 'Quick Apply', onClick: openQuickApply },
    footer.contact_email ? { href: `mailto:${footer.contact_email}`, label: 'Contact Us' } : { href: '#footer-contact', label: 'Contact Us' },
    { to: '/privacy', label: 'Privacy' },
  ]

  return (
    <footer className="relative isolate overflow-hidden bg-gradient-to-br from-brand-900 via-navy to-ink text-white">
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1.2fr_0.8fr] lg:gap-12 2xl:max-w-7xl md:[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <div id="footer-contact" className="flex flex-col gap-5">
          <Link to="/" viewTransition className="inline-flex min-h-11 items-center self-start rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Back to the careers home page">
            <GroupLogo tone="dark" />
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-white/75">{footer.closing_text || DEFAULT_CLOSING}</p>
          <ul className="flex flex-col text-sm text-white/80">
            {footer.address ? <li className="flex items-start gap-2.5 py-2"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" /><span className="leading-relaxed">{footer.address}</span></li> : null}
            {footer.contact_email ? <li><a href={`mailto:${footer.contact_email}`} className={`${linkClass} gap-2.5 break-all`}><EnvelopeIcon className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />{footer.contact_email}</a></li> : null}
            {footer.contact_phone ? <li><a href={`tel:${footer.contact_phone.replace(/\s/g, '')}`} className={`${linkClass} gap-2.5`}><PhoneIcon className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />{footer.contact_phone}</a></li> : null}
          </ul>
        </div>

        {entities.length ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Our companies</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {entities.map((entity) => (
                <li key={entity.slug}>
                  <a
                    href={entity.website_url || `/jobs?entity=${entity.slug}`}
                    {...(entity.website_url ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                    className="group flex min-h-14 items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <EntityLogo entity={entity} size="sm" className="!bg-white" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{entity.name}</span>
                      {entity.website_url ? <span className="block truncate text-xs text-white/60">{host(entity.website_url)}</span> : null}
                    </span>
                    {entity.website_url ? <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0 text-white/50 transition group-hover:text-white" aria-hidden="true" /> : null}
                    {entity.website_url ? <span className="sr-only">(opens in a new tab)</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <nav aria-label="Footer">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Quick links</h2>
            <ul className="mt-2 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-1">
              {links.map((item) => (
                <li key={item.label}>
                  {item.to ? <Link className={linkClass} to={item.to} viewTransition>{item.label}</Link> : <a className={linkClass} href={item.href} onClick={item.onClick}>{item.label}</a>}
                </li>
              ))}
              <li>
                <button type="button" onClick={openJobAlerts} className={linkClass}>Get job alerts</button>
              </li>
            </ul>
          </nav>
          {social.length ? (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Social media">
              {social.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${link.name} (opens in a new tab)`}
                    title={link.name}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/85 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <SocialIcon name={link.name} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-white/60 sm:flex-row 2xl:max-w-7xl">
          <p>© {year} {footer.copyright ?? 'Infolks Group. All Rights Reserved.'}</p>
          <a href={GROUP.website} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center hover:text-white">
            {host(GROUP.website)}<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </footer>
  )
}

SiteFooter.propTypes = {
  footer: PropTypes.object,
  social: PropTypes.array,
  /** The group's companies, linked to their own websites. */
  entities: PropTypes.array,
}

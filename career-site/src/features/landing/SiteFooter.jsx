import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { ArrowUpRightIcon, BellAlertIcon, EnvelopeIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { GROUP } from '@shared/brand'
import { GroupLogo } from '@shared/ui/BrandLogo'
import { useQuickApply } from '../apply/quickApplyContext'
import { SocialIcon } from './SocialIcon'

const DEFAULT_CLOSING = 'Every new person brings a new perspective, a new possibility, and another story to be part of. We look forward to discovering yours.'
const host = (url) => url?.replace(/^https?:\/\//, '').replace(/\/$/, '')

const heading = 'text-xs font-semibold uppercase tracking-[0.16em] text-white/50'
const link = 'inline-flex min-h-11 items-center gap-2 rounded text-sm text-white/80 transition duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white'

/**
 * Section 7, on every careers page. Kept simple: the group and its closing message with job alerts and social
 * links on top; three short columns (Explore, Our companies, Contact); and a thin copyright line.
 */
export function SiteFooter({ footer: setting, social = [], entities = [] }) {
  const { openQuickApply, openJobAlerts } = useQuickApply()
  const footer = setting ?? {}
  const year = new Date().getFullYear()

  const explore = [
    { to: '/', label: 'Careers' },
    { to: '/jobs', label: 'Job Search' },
    { to: '/jobs?level=internship', label: 'Internship' },
    { href: '/#quick-apply', label: 'Quick Apply', onClick: openQuickApply },
    footer.contact_email ? { href: `mailto:${footer.contact_email}`, label: 'Contact Us' } : { href: '#footer-contact', label: 'Contact Us' },
  ]

  return (
    <footer className="bg-gradient-to-b from-navy to-ink text-white">
      <div className="mx-auto max-w-6xl px-4 2xl:max-w-7xl">
        {/* The group, its message, job alerts and social links. */}
        <div className="flex flex-col gap-6 border-b border-white/10 py-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <Link to="/" viewTransition className="inline-flex min-h-11 items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Back to the careers home page">
              <GroupLogo tone="dark" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{footer.closing_text || DEFAULT_CLOSING}</p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <button
              type="button"
              onClick={openJobAlerts}
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-white px-5 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy md:self-end"
            >
              <BellAlertIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Get job alerts
            </button>
            {social.length ? (
              <ul className="flex flex-wrap gap-2" aria-label="Social media">
                {social.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${item.name} (opens in a new tab)`}
                      title={item.name}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/85 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <SocialIcon name={item.name} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* Three short columns. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-3">
          <nav aria-label="Footer">
            <h2 className={heading}>Explore</h2>
            <ul className="mt-2">
              {explore.map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <Link className={link} to={item.to} viewTransition>{item.label}</Link>
                  ) : (
                    <a className={link} href={item.href} onClick={item.onClick}>{item.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {entities.length ? (
            <div>
              <h2 className={heading}>Our companies</h2>
              <ul className="mt-2">
                {entities.map((entity) => (
                  <li key={entity.slug}>
                    {entity.website_url ? (
                      <a className={`${link} group`} href={entity.website_url} target="_blank" rel="noreferrer noopener">
                        {entity.name}
                        <ArrowUpRightIcon className="h-3.5 w-3.5 text-white/40 transition group-hover:text-white" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link className={link} to={`/jobs?entity=${entity.slug}`} viewTransition>{entity.name}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div id="footer-contact" className="col-span-2 md:col-span-1">
            <h2 className={heading}>Contact</h2>
            <ul className="mt-2">
              {footer.contact_email ? (
                <li><a className={`${link} break-all`} href={`mailto:${footer.contact_email}`}><EnvelopeIcon className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />{footer.contact_email}</a></li>
              ) : null}
              {footer.contact_phone ? (
                <li><a className={link} href={`tel:${footer.contact_phone.replace(/\s/g, '')}`}><PhoneIcon className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />{footer.contact_phone}</a></li>
              ) : null}
              {footer.address ? (
                <li className="flex items-start gap-2 py-2 text-sm leading-relaxed text-white/70"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />{footer.address}</li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-white/55 sm:flex-row 2xl:max-w-7xl">
          <p>© {year} {footer.copyright ?? 'Infolks Group. All Rights Reserved.'}</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" viewTransition className="inline-flex min-h-11 items-center hover:text-white">Privacy</Link>
            <a href={GROUP.website} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center hover:text-white">
              {host(GROUP.website)}<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
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

import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { ArrowTopRightOnSquareIcon, EnvelopeIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { GROUP } from '@shared/brand'
import { Aurora } from '@shared/ui/Aurora'
import { EntityLogo, GroupLogo } from '@shared/ui/BrandLogo'
import { SocialIcon } from './SocialIcon'

const explore = [
  { to: '/', label: 'Careers home' },
  { to: '/jobs', label: 'Job Search' },
  { to: '/jobs?level=internship', label: 'Internships' },
  { to: '/#quick-apply', label: 'Quick apply', hash: true },
  { to: '/privacy', label: 'Privacy' },
]

/**
 * Second half of section 9: the group, its four companies, links, contact and social media.
 * Used on every careers page.
 */
export function SiteFooter({ footer: setting, social = [], entities = [] }) {
  const footer = setting ?? {}
  const year = new Date().getFullYear()
  const linkClass = 'inline-flex min-h-11 items-center gap-2 text-sm text-white/70 transition duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded'

  return (
    <footer className="relative isolate overflow-hidden bg-ink text-white">
      <Aurora tone="dark" className="opacity-40" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" aria-hidden="true" />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1.2fr_0.8fr] 2xl:max-w-7xl">
        <div className="flex flex-col gap-5">
          <GroupLogo tone="dark" className="self-start" />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">
            {footer.tagline ?? GROUP.tagline}. Four companies working in data labeling, AI data collection, medical annotation and software.
          </p>
          <ul className="flex flex-col text-sm text-white/75">
            {footer.address ? (
              <li className="flex items-start gap-2 py-2"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{footer.address}</li>
            ) : null}
            {footer.contact_email ? (
              <li><a href={`mailto:${footer.contact_email}`} className={linkClass}><EnvelopeIcon className="h-4 w-4" aria-hidden="true" />{footer.contact_email}</a></li>
            ) : null}
            {footer.contact_phone ? (
              <li><a href={`tel:${footer.contact_phone.replace(/\s/g, '')}`} className={linkClass}><PhoneIcon className="h-4 w-4" aria-hidden="true" />{footer.contact_phone}</a></li>
            ) : null}
          </ul>
        </div>

        {entities.length ? (
          <nav aria-labelledby="footer-companies">
            <h2 id="footer-companies" className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Our companies</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {entities.map((entity) => (
                <li key={entity.slug}>
                  <a
                    href={entity.website_url || `/jobs?entity=${entity.slug}`}
                    {...(entity.website_url ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                    className="glass-dark group flex min-h-14 items-center gap-3 rounded-2xl border p-2 pr-3 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.14] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <EntityLogo entity={entity} size="sm" className="!bg-white" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{entity.name}</span>
                      {entity.website_url ? <span className="block truncate text-xs text-white/60">{entity.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span> : null}
                    </span>
                    {entity.website_url ? (
                      <>
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0 text-white/50 transition duration-200 group-hover:text-white" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="flex flex-col gap-6">
          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Explore</h2>
            <ul className="mt-2 flex flex-col">
              {explore.map((item) => (
                <li key={item.to}>
                  {item.hash ? <a className={linkClass} href={item.to}>{item.label}</a> : <Link className={linkClass} to={item.to} viewTransition>{item.label}</Link>}
                </li>
              ))}
            </ul>
          </nav>
          {social.length ? (
            <ul className="flex flex-wrap gap-2" aria-label="Infolks Group on social media">
              {social.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${link.name} (opens in a new tab)`}
                    className="glass-dark flex h-11 w-11 items-center justify-center rounded-full border transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs 2xl:max-w-7xl text-white/60 sm:flex-row">
          <p>© {year} {footer.copyright ?? 'Infolks Group. All rights reserved.'}</p>
          <a href={GROUP.website} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center hover:text-white">infolksgroup.com</a>
        </div>
      </div>
    </footer>
  )
}

SiteFooter.propTypes = { footer: PropTypes.object, social: PropTypes.array, entities: PropTypes.array }

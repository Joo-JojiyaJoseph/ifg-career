import PropTypes from 'prop-types'
import { Stagger, StaggerItem } from '@shared/ui/Motion'
import { iconFor } from '@shared/ui/heroiconMap'
import { SectionHeading } from './SectionHeading'

const tints = ['from-brand-500 to-brand-700', 'from-teal to-emerald-500', 'from-amber to-accent-orange']

/**
 * Section 3: "Why Join Infolks Group" (who we are). The intro, then How We Work, What We Provide and
 * Our Culture as three cards, each with a coloured icon tile.
 */
export function BelongSection({ about }) {
  const paragraphs = String(about?.intro ?? '').split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean)
  const blocks = about?.blocks ?? []

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-white py-20 md:py-28" aria-labelledby="belong-title">
      <div className="pointer-events-none absolute -right-32 top-0 -z-10 h-96 w-96 rounded-full bg-cyan/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-32 bottom-0 -z-10 h-80 w-80 rounded-full bg-violet/10 blur-3xl" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 2xl:max-w-7xl">
        <SectionHeading id="belong-title" eyebrow="Who we are" title={about?.title ?? 'Why Join Infolks Group'} intro={paragraphs.join(' ') || undefined} />

        {blocks.length ? (
          <Stagger as="ol" className="grid gap-5 md:grid-cols-3">
            {blocks.map((block, index) => {
              const Icon = iconFor(block.heroicon_name)
              return (
                <StaggerItem as="li" key={block.id} className="rounded-[1.75rem] border border-white bg-white/80 p-6 shadow-card backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-7">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md ${tints[index % tints.length]}`} aria-hidden="true">
                    {Icon ? <Icon className="h-6 w-6" /> : <span className="font-display font-semibold">{index + 1}</span>}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                    <span className="sr-only">{String(index + 1).padStart(2, '0')}. </span>
                    {block.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted">{block.body}</p>
                </StaggerItem>
              )
            })}
          </Stagger>
        ) : null}
      </div>
    </section>
  )
}

BelongSection.propTypes = {
  about: PropTypes.shape({ title: PropTypes.string, intro: PropTypes.string, blocks: PropTypes.array }),
}

import PropTypes from 'prop-types'
import { Aurora } from '@shared/ui/Aurora'
import { Stagger, StaggerItem } from '@shared/ui/Motion'
import { iconFor } from '@shared/ui/heroiconMap'
import { SectionHeading } from './SectionHeading'

const tints = [
  'from-brand-500 to-brand-700 shadow-brand-500/30',
  'from-teal-400 to-teal-600 shadow-teal-500/30',
  'from-amber-400 to-accent-orange shadow-amber-500/30',
]

/**
 * Section 4: a short introduction and three blocks (How we work, What we provide, Our culture).
 * Frosted glass cards over a soft aurora.
 */
export function AboutSection({ about }) {
  if (!about) return null

  return (
    <section className="relative isolate overflow-hidden py-20 md:py-28" aria-labelledby="about-title">
      <Aurora tone="light" />
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading id="about-title" eyebrow="Who we are" title={about.title ?? 'About the group'} intro={about.intro} />
        <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {about.blocks.map((block, index) => {
            const Icon = iconFor(block.heroicon_name)
            return (
              <StaggerItem key={block.id} className="h-full">
                <div className="glass group h-full rounded-3xl p-7 transition duration-200 hover:-translate-y-1 hover:bg-white/75">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition duration-200 group-hover:scale-110 group-hover:-rotate-6 ${tints[index % tints.length]}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink">{block.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{block.body}</p>
                </div>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </section>
  )
}

AboutSection.propTypes = { about: PropTypes.object }

import PropTypes from 'prop-types'
import { m } from 'framer-motion'
import { Reveal, Stagger, StaggerItem } from '@shared/ui/Motion'
import { Photo } from '@shared/ui/Photo'
import { iconFor } from '@shared/ui/heroiconMap'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'

const tiles = [
  'col-span-2 aspect-[16/10] sm:col-span-1 sm:row-span-2 sm:aspect-auto',
  'aspect-square',
  'aspect-square',
  'col-span-2 aspect-[16/9]',
]

/**
 * Section 3: "Why Join Infolks Group". The intro, three numbered glass cards
 * (How we work, What we provide, Our culture) and a mosaic of culture photos that HR manages.
 */
export function BelongSection({ about, photos = [] }) {
  const reduced = usePrefersReducedMotion()
  const paragraphs = String(about?.intro ?? '').split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean)
  const blocks = about?.blocks ?? []
  const mosaic = photos.slice(0, 4)

  return (
    <section className="relative isolate overflow-hidden bg-white py-20 md:py-28" aria-labelledby="belong-title">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-amber/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-10 -z-10 h-80 w-80 rounded-full bg-rose-300/30 blur-3xl" aria-hidden="true" />

      <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 2xl:max-w-7xl">
        <div className="flex flex-col gap-8">
          <Reveal>
            <h2 id="belong-title" className="font-display text-[clamp(2rem,2.8vw+1rem,3.25rem)] font-semibold leading-[1.05] tracking-tight text-ink">
              {about?.title ?? 'Why Join Infolks Group'}
            </h2>
            {paragraphs.map((text, index) => (
              <p key={index} className={`mt-5 max-w-xl leading-relaxed ${index ? 'text-muted' : 'text-lg text-text'}`}>{text}</p>
            ))}
          </Reveal>

          {blocks.length ? (
            <Stagger as="ol" className="flex flex-col gap-4">
              {blocks.map((block, index) => {
                const Icon = iconFor(block.heroicon_name)
                return (
                  <StaggerItem as="li" key={block.id} className="glass group relative flex gap-5 rounded-3xl p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-6">
                    <span className="font-display text-4xl font-semibold leading-none tracking-tight text-transparent [-webkit-text-stroke:1.5px_theme(colors.brand.500)]" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                        {Icon ? <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" /> : null}
                        <span><span className="sr-only">{String(index + 1).padStart(2, '0')}. </span>{block.title}</span>
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{block.body}</p>
                    </div>
                  </StaggerItem>
                )
              })}
            </Stagger>
          ) : null}
        </div>

        {mosaic.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:sticky lg:top-24">
            {mosaic.map((photo, index) => (
              <m.figure
                key={photo.id}
                className={`group relative overflow-hidden rounded-[1.75rem] shadow-lift ${mosaic.length === 4 ? tiles[index] : 'col-span-2 aspect-[16/10]'}`}
                {...(reduced ? {} : { initial: { opacity: 0, y: 30, scale: 0.97 }, whileInView: { opacity: 1, y: 0, scale: 1 }, viewport: { once: true, amount: 0.25 }, transition: { duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] } })}
              >
                <Photo src={photo.photo_url} alt={photo.caption || photo.title} className="!absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 300px, 50vw" />
                <figcaption className="glass-ink absolute inset-x-2 bottom-2 rounded-2xl px-3 py-2 text-xs font-medium sm:inset-x-3 sm:bottom-3 sm:text-sm">
                  {photo.title}
                </figcaption>
              </m.figure>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

BelongSection.propTypes = {
  about: PropTypes.shape({ title: PropTypes.string, intro: PropTypes.string, blocks: PropTypes.array }),
  photos: PropTypes.array,
}

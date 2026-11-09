import PropTypes from 'prop-types'
import { Marquee } from '@shared/ui/Marquee'
import { Photo } from '@shared/ui/Photo'

/**
 * A slow, endless strip of real team photos. It pauses while the pointer is over it,
 * and becomes a plain wrapped row with reduced motion.
 */
export function PhotoMarquee({ photos }) {
  if (photos.length < 3) return null

  return (
    <section aria-label="Life at Infolks Group" className="overflow-hidden bg-white pb-12 md:pb-20">
      <Marquee className="py-8">
        {photos.map((photo, index) => (
          <figure key={photo.id} className={`group relative w-64 shrink-0 overflow-hidden rounded-[1.75rem] shadow-lift sm:w-80 ${index % 2 ? 'translate-y-4' : '-translate-y-2'}`}>
            <Photo src={photo.photo_url} alt={photo.caption || photo.title} className="aspect-[4/3]" imgClassName="transition-transform duration-700 group-hover:scale-110" sizes="320px" />
            <figcaption className="glass-ink absolute inset-x-3 bottom-3 rounded-2xl px-3 py-2 text-sm font-medium">{photo.title}</figcaption>
          </figure>
        ))}
      </Marquee>
    </section>
  )
}

PhotoMarquee.propTypes = { photos: PropTypes.array.isRequired }

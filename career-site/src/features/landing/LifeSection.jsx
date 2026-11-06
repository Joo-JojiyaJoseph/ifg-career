import { useState } from 'react'
import PropTypes from 'prop-types'
import { PlayIcon } from '@heroicons/react/24/solid'
import { Aurora } from '@shared/ui/Aurora'
import { Avatar } from '@shared/ui/Avatar'
import { Modal } from '@shared/ui/Modal'
import { Reveal } from '@shared/ui/Motion'
import { Tabs } from '@shared/ui/Tabs'
import { formatDate } from '@shared/lib/formatDate'
import { SectionHeading } from './SectionHeading'

/**
 * Section 6: employee experiences and recruitment drive photos, plus optional videos and activities.
 */
export function LifeSection({ stories = [], drives = [], media = [] }) {
  const [photo, setPhoto] = useState(null)
  const [tab, setTab] = useState('people')

  if (!stories.length && !drives.length && !media.length) return null

  return (
    <section className="relative isolate overflow-hidden py-20 md:py-28" aria-labelledby="life-title">
      <Aurora tone="light" className="opacity-80" />
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading id="life-title" eyebrow="Our people" title="Life at the group" intro="Hear from the people who work here, and see where we have been hiring." />
        {media.length ? (
          <div className="mb-6 flex justify-center">
            <Tabs value={tab} onChange={setTab} items={[{ id: 'people', label: 'People and drives' }, { id: 'media', label: 'Videos and activities' }]} label="Life at the group" />
          </div>
        ) : null}
        {tab === 'people' ? (
          <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            {stories.length ? (
              <div className="glass min-w-0 rounded-3xl p-5 sm:p-6">
                <h3 className="mb-4 font-display text-lg font-semibold text-navy">Employee experiences</h3>
                <ul className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                  {stories.map((story) => (
                    <li key={story.id} className="w-[85%] shrink-0 snap-start rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white transition duration-200 hover:-translate-y-0.5 hover:shadow-card sm:w-[60%] lg:w-auto">
                      <figure className="flex gap-4">
                        <Avatar name={story.name} src={story.photo_url?.includes('/placeholders/') ? null : story.photo_url} size="lg" />
                        <div>
                          <blockquote className="leading-relaxed text-text">“{story.quote}”</blockquote>
                          <figcaption className="mt-2 text-sm">
                            <span className="font-semibold text-navy">{story.name}</span>
                            <span className="text-muted">, {story.role}{story.entity ? ` at ${story.entity}` : ''}</span>
                          </figcaption>
                        </div>
                      </figure>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {drives.length ? (
              <div className="glass min-w-0 rounded-3xl p-5 sm:p-6">
                <h3 className="mb-4 font-display text-lg font-semibold text-navy">Recruitment drives</h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {drives.map((drive) => (
                    <li key={drive.id}>
                      <button type="button" onClick={() => setPhoto(drive)} className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl">
                        <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-brand-50 ring-1 ring-white/80">
                          <img src={drive.photo_url} alt={drive.caption || drive.name} loading="lazy" width="320" height="240" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                          <span className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" aria-hidden="true" />
                        </span>
                        <span className="mt-2 block text-sm font-medium text-navy">{drive.name}</span>
                        <span className="block text-xs text-muted">{formatDate(drive.date)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Reveal>
        ) : (
          <MediaGrid items={media} onPhoto={setPhoto} />
        )}
      </div>
      <Modal open={Boolean(photo)} onClose={() => setPhoto(null)} title={photo?.name ?? photo?.title ?? 'Photo'}>
        {photo ? (
          <figure>
            <img src={photo.photo_url} alt={photo.caption || photo.name || photo.title} className="w-full rounded-xl" />
            {photo.caption ? <figcaption className="mt-3 text-sm text-muted">{photo.caption}{photo.date ? ` · ${formatDate(photo.date)}` : ''}</figcaption> : null}
          </figure>
        ) : null}
      </Modal>
    </section>
  )
}

function MediaGrid({ items, onPhoto }) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="glass overflow-hidden rounded-3xl transition duration-200 hover:-translate-y-1 hover:shadow-lift">
          {item.type === 'video' ? <LiteYouTube id={item.youtube_id} title={item.title} /> : (
            <button type="button" className="block aspect-video w-full overflow-hidden" onClick={() => onPhoto(item)}>
              <img src={item.photo_url} alt={item.caption || item.title} loading="lazy" className="h-full w-full object-cover" />
            </button>
          )}
          <div className="p-4">
            <p className="font-medium text-navy">{item.title}</p>
            {item.caption ? <p className="text-sm text-muted">{item.caption}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Shows the thumbnail first; the YouTube player only loads when someone presses play. */
function LiteYouTube({ id, title }) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  return (
    <button type="button" onClick={() => setPlaying(true)} className="group relative block aspect-video w-full overflow-hidden bg-navy" aria-label={`Play video: ${title}`}>
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-105" />
      <span className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-card transition duration-200 group-hover:scale-110">
        <PlayIcon className="ml-1 h-8 w-8" aria-hidden="true" />
      </span>
    </button>
  )
}

LifeSection.propTypes = { stories: PropTypes.array, drives: PropTypes.array, media: PropTypes.array }
MediaGrid.propTypes = { items: PropTypes.array.isRequired, onPhoto: PropTypes.func.isRequired }
LiteYouTube.propTypes = { id: PropTypes.string.isRequired, title: PropTypes.string.isRequired }

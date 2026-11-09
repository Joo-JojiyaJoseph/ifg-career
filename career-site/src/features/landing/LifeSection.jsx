import { useState } from 'react'
import PropTypes from 'prop-types'
import { PlayIcon } from '@heroicons/react/24/solid'
import { formatDate } from '@shared/lib/formatDate'
import { Modal } from '@shared/ui/Modal'
import { Photo } from '@shared/ui/Photo'
import { Tabs } from '@shared/ui/Tabs'
import { isPlaceholder } from './api'
import { SectionHeading } from './SectionHeading'

const avatarTints = ['bg-amber', 'bg-violet', 'bg-teal', 'bg-brand-500']
const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

/**
 * Life at the group (requirements LP-08): employee experiences and recruitment drives on one tab, culture
 * photos and videos on the other. Everything comes from Website Content; tabs with nothing in them are hidden.
 */
export function LifeSection({ stories = [], drives = [], photos = [], videos = [] }) {
  const tabs = [
    stories.length || drives.length ? { id: 'people', label: 'People and drives' } : null,
    photos.length || videos.length ? { id: 'media', label: 'Videos and activities' } : null,
  ].filter(Boolean)
  const [tab, setTab] = useState(tabs[0]?.id)
  const [playing, setPlaying] = useState(null)

  if (!tabs.length) return null
  const current = tabs.some((item) => item.id === tab) ? tab : tabs[0].id

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-brand-50 to-white py-20 md:py-28" aria-labelledby="life-title">
      <div className="pointer-events-none absolute -right-32 top-20 -z-10 h-96 w-96 rounded-full bg-cyan/15 blur-3xl" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 2xl:max-w-7xl">
        <SectionHeading id="life-title" eyebrow="Our people" title="Life at the group" intro="Hear from the people who work here, and see where we have been hiring." />
        {tabs.length > 1 ? (
          <div className="mb-8 flex justify-center">
            <Tabs items={tabs} value={current} onChange={setTab} label="Life at the group" />
          </div>
        ) : null}

        {current === 'people' ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            {stories.length ? (
              <div className="rounded-[1.75rem] border border-white bg-white/80 p-5 shadow-card backdrop-blur sm:p-6">
                <h3 className="font-display text-lg font-semibold text-ink">Employee experiences</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {stories.map((story, index) => (
                    <li key={story.id} className="flex gap-4 rounded-2xl bg-brand-50/60 p-4">
                      {isPlaceholder(story.photo_url) ? (
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold text-white ${avatarTints[index % avatarTints.length]}`} aria-hidden="true">{initials(story.name)}</span>
                      ) : (
                        <Photo src={story.photo_url} alt="" className="h-12 w-12 shrink-0 rounded-full" sizes="48px" />
                      )}
                      <figure className="min-w-0">
                        <blockquote className="leading-relaxed text-ink">&ldquo;{story.quote}&rdquo;</blockquote>
                        <figcaption className="mt-1.5 text-sm text-muted">
                          <span className="font-semibold text-navy">{story.name}</span>
                          {story.role ? `, ${story.role}` : ''}
                          {story.entity ? ` at ${story.entity}` : ''}
                        </figcaption>
                      </figure>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {drives.length ? (
              <div className="rounded-[1.75rem] border border-white bg-white/80 p-5 shadow-card backdrop-blur sm:p-6">
                <h3 className="font-display text-lg font-semibold text-ink">Recruitment drives</h3>
                <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {drives.map((drive) => (
                    <li key={drive.id}>
                      <Photo src={drive.photo_url} alt={drive.caption ?? ''} className="aspect-[4/3] rounded-2xl" sizes="200px" />
                      <p className="mt-2 text-sm font-medium leading-snug text-navy">{drive.name}</p>
                      {drive.date ? <p className="text-xs text-muted">{formatDate(drive.date)}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {photos.length ? (
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {photos.slice(0, 8).map((photo) => (
                  <li key={photo.id} className="group relative overflow-hidden rounded-[1.5rem] shadow-card">
                    <Photo src={photo.photo_url} alt={photo.caption || photo.title} className="aspect-[4/3]" imgClassName="transition-transform duration-700 group-hover:scale-105" sizes="(min-width: 768px) 25vw, 50vw" />
                    <p className="absolute inset-x-2 bottom-2 rounded-xl bg-ink/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur sm:text-sm">{photo.title}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {videos.length ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <li key={video.id}>
                    <button type="button" onClick={() => setPlaying(video)} className="group block w-full overflow-hidden rounded-[1.5rem] bg-white text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                      <span className="relative block aspect-video overflow-hidden bg-ink">
                        <img src={`https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <span className="absolute inset-0 flex items-center justify-center bg-ink/25">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-lift transition-transform duration-200 group-hover:scale-110"><PlayIcon className="ml-0.5 h-6 w-6" aria-hidden="true" /></span>
                        </span>
                      </span>
                      <span className="block px-4 py-3 font-medium text-ink">{video.title}<span className="sr-only"> (play video)</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      <Modal open={Boolean(playing)} onClose={() => setPlaying(null)} size="xl" title={playing?.title ?? 'Video'}>
        {playing ? (
          <div className="aspect-video overflow-hidden rounded-2xl bg-ink">
            <iframe src={`https://www.youtube-nocookie.com/embed/${playing.youtube_id}?autoplay=1&rel=0`} title={playing.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
          </div>
        ) : null}
      </Modal>
    </section>
  )
}

LifeSection.propTypes = {
  stories: PropTypes.array,
  drives: PropTypes.array,
  photos: PropTypes.array,
  videos: PropTypes.array,
}

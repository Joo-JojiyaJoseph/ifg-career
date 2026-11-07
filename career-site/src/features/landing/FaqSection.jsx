import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { AnimatePresence, m } from 'framer-motion'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { SafeHtml } from '@shared/ui/SafeHtml'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'
import { SectionHeading } from './SectionHeading'

/**
 * Section 6: "A few things you might want to know". Numbered questions that open one at a time. Also publishes FAQPage structured data for search.
 */
export function FaqSection({ faqs = [], section }) {
  const [open, setOpen] = useState(faqs[0]?.id ?? null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!faqs.length) return undefined
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.faq = 'true'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() },
      })),
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [faqs])

  if (!faqs.length) return null

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-brand-50 to-white py-20 md:py-28" aria-labelledby="faq-title">
      <div className="pointer-events-none absolute -left-32 top-24 -z-10 h-80 w-80 rounded-full bg-cyan/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 bottom-10 -z-10 h-80 w-80 rounded-full bg-amber/25 blur-3xl" aria-hidden="true" />
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading id="faq-title" title={section?.title ?? 'A few things you might want to know'} />
        <ul className="flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const expanded = open === faq.id
            return (
              <li key={faq.id} className={`glass overflow-hidden rounded-3xl transition duration-200 ${expanded ? 'shadow-lift' : 'hover:-translate-y-0.5 hover:shadow-card'}`}>
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${faq.id}`}
                    aria-expanded={expanded}
                    aria-controls={`faq-a-${faq.id}`}
                    onClick={() => setOpen(expanded ? null : faq.id)}
                    className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-display font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className={`font-display text-sm font-semibold tabular-nums transition-colors duration-200 ${expanded ? 'text-brand-600' : 'text-muted'}`}>{String(index + 1).padStart(2, '0')}</span>
                      <span>{faq.question}</span>
                    </span>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition duration-200 ${expanded ? 'rotate-180 bg-gradient-to-br from-brand-500 to-brand-700 text-white' : 'bg-brand-50 text-brand-700'}`}>
                      {expanded ? <MinusIcon className="h-5 w-5" aria-hidden="true" /> : <PlusIcon className="h-5 w-5" aria-hidden="true" />}
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {expanded ? (
                    <m.div
                      id={`faq-a-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-q-${faq.id}`}
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reduced ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <SafeHtml html={faq.answer} className="prose prose-sm max-w-none px-5 pb-5 pl-[3.25rem] text-muted prose-a:text-brand-700" />
                    </m.div>
                  ) : null}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

FaqSection.propTypes = { faqs: PropTypes.array, section: PropTypes.shape({ title: PropTypes.string }) }

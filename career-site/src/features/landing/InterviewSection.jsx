import { useRef } from 'react'
import PropTypes from 'prop-types'
import { m, useInView } from 'framer-motion'
import { Photo } from '@shared/ui/Photo'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'
import { SectionHeading } from './SectionHeading'

/**
 * Section 4: "How we hire · Our Recruitment Process".
 * Glass step cards over a dimmed photo. The connecting line draws itself as the section scrolls into view,
 * then each step rises in. Vertical on phones and tablets, one row of steps on large screens.
 */
export function InterviewSection({ steps, section }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const reduced = usePrefersReducedMotion()

  if (!steps?.length) return null

  const show = reduced || inView

  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 text-white md:py-28" aria-labelledby="interview-title">
      <Photo src={section?.image} alt="" className="!absolute inset-0 -z-20" imgClassName="scale-105 blur-[2px]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/95 via-ink/80 to-ink/95" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 top-0 -z-10 h-96 w-96 rounded-full bg-violet/30 blur-3xl" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-4 2xl:max-w-7xl">
        <SectionHeading id="interview-title" tone="dark" eyebrow={section?.eyebrow ?? undefined} title={section?.title ?? 'Our Recruitment Process'} />
        <div ref={ref} className="relative">
          <div className="pointer-events-none absolute bottom-10 left-[1.75rem] top-10 w-px bg-white/15 lg:hidden" aria-hidden="true">
            <m.div className="h-full w-full origin-top bg-gradient-to-b from-cyan via-brand-400 to-amber" initial={{ scaleY: reduced ? 1 : 0 }} animate={{ scaleY: show ? 1 : 0 }} transition={{ duration: 1.6, ease: 'easeOut' }} />
          </div>
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-[1.75rem] hidden h-px bg-white/15 lg:block" aria-hidden="true">
            <m.div className="h-full origin-left bg-gradient-to-r from-cyan via-brand-400 to-amber" initial={{ scaleX: reduced ? 1 : 0 }} animate={{ scaleX: show ? 1 : 0 }} transition={{ duration: 1.6, ease: 'easeOut' }} />
          </div>
          <ol className="relative grid gap-5 lg:auto-cols-fr lg:grid-flow-col lg:gap-4">
            {steps.map((step, index) => {
              const number = String(index + 1).padStart(2, '0')
              const last = index === steps.length - 1
              return (
                <m.li
                  key={step.id ?? step.name}
                  className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center"
                  initial={reduced ? false : { opacity: 0, y: 24 }}
                  animate={show ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.25 + index * 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-semibold ring-4 ring-ink ${last ? 'bg-gradient-to-br from-amber to-accent-orange text-ink shadow-[0_0_34px_-4px_rgba(255,194,51,0.7)]' : 'bg-gradient-to-br from-cyan to-brand-600 text-white shadow-[0_0_30px_-4px_rgba(41,182,246,0.6)]'}`} aria-hidden="true">
                    {number}
                  </span>
                  <div className="glass-dark min-w-0 flex-1 rounded-3xl p-5 transition duration-200 hover:-translate-y-1 hover:bg-white/[0.12] lg:mt-6 lg:w-full">
                    <h3 className="font-display text-lg font-semibold text-white"><span className="sr-only">{number}. </span>{step.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">{step.description}</p>
                  </div>
                </m.li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

InterviewSection.propTypes = {
  steps: PropTypes.array,
  section: PropTypes.shape({ eyebrow: PropTypes.string, title: PropTypes.string, image: PropTypes.string }),
}

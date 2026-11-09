import { useRef } from 'react'
import PropTypes from 'prop-types'
import { m, useInView } from 'framer-motion'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'
import { SectionHeading } from './SectionHeading'

/**
 * Section 4: "How we hire · Our Recruitment Process" on navy. Numbered tiles on a line that draws itself as the
 * section comes into view, each with a glass card under it. One row on large screens, a vertical list below.
 */
export function InterviewSection({ steps, section }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const reduced = usePrefersReducedMotion()

  if (!steps?.length) return null
  const show = reduced || inView

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-800 via-navy to-ink py-20 text-white md:py-28" aria-labelledby="interview-title">
      <div className="pointer-events-none absolute -right-32 top-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 -z-10 h-80 w-[36rem] rounded-full bg-violet/25 blur-3xl" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 2xl:max-w-7xl">
        <SectionHeading
          id="interview-title"
          tone="dark"
          eyebrow={section?.eyebrow || `${steps.length} clear steps`}
          title={section?.title ?? 'Our Recruitment Process'}
          intro="What to expect after you apply. The same steps apply to every role."
        />
        <div ref={ref} className="relative">
          <div className="pointer-events-none absolute bottom-8 left-[1.4rem] top-8 w-px bg-white/15 lg:hidden" aria-hidden="true">
            <m.div className="h-full w-full origin-top bg-gradient-to-b from-cyan via-brand-400 to-violet" initial={{ scaleY: reduced ? 1 : 0 }} animate={{ scaleY: show ? 1 : 0 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
          </div>
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-[1.4rem] hidden h-px bg-white/15 lg:block" aria-hidden="true">
            <m.div className="h-full origin-left bg-gradient-to-r from-cyan via-brand-400 to-violet" initial={{ scaleX: reduced ? 1 : 0 }} animate={{ scaleX: show ? 1 : 0 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
          </div>
          <ol className="relative grid gap-5 lg:auto-cols-fr lg:grid-flow-col lg:gap-4">
            {steps.map((step, index) => {
              const number = String(index + 1).padStart(2, '0')
              return (
                <m.li
                  key={step.id ?? step.name}
                  className="flex gap-4 lg:flex-col lg:items-center lg:text-center"
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  animate={show ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan to-brand-600 font-display font-semibold shadow-[0_0_0_6px_rgba(10,37,64,0.9),0_10px_30px_-6px_rgba(34,199,240,0.6)]" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur lg:w-full">
                    <h3 className="font-display text-lg font-semibold text-white"><span className="sr-only">{number}. </span>{step.name}</h3>
                    {step.description ? <p className="mt-2 text-sm leading-relaxed text-white/70">{step.description}</p> : null}
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
  section: PropTypes.shape({ eyebrow: PropTypes.string, title: PropTypes.string }),
}

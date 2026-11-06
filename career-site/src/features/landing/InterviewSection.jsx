import { useRef } from 'react'
import PropTypes from 'prop-types'
import { m, useInView } from 'framer-motion'
import { Aurora } from '@shared/ui/Aurora'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'
import { SectionHeading } from './SectionHeading'

/**
 * Section 5: the interview steps in order, on the ink background.
 * The connecting line fills as the section scrolls into view, then each glass step card rises in.
 */
export function InterviewSection({ steps }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const reduced = usePrefersReducedMotion()

  if (!steps?.length) return null

  const show = reduced || inView

  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 text-white md:py-28" aria-labelledby="interview-title">
      <Aurora tone="dark" className="opacity-70" />
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          id="interview-title"
          tone="dark"
          eyebrow={`${steps.length} clear steps`}
          title="Our interview procedure"
          intro="What to expect after you apply. The same steps apply to every role."
        />
        <div ref={ref} className="relative">
          <div className="pointer-events-none absolute bottom-8 left-[1.6rem] top-8 w-px bg-white/10 md:hidden" aria-hidden="true">
            <m.div className="h-full w-full origin-top bg-gradient-to-b from-cyan to-brand-500" initial={{ scaleY: reduced ? 1 : 0 }} animate={{ scaleY: show ? 1 : 0 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
          </div>
          <div className="pointer-events-none absolute left-[8%] right-[8%] top-[1.6rem] hidden h-px bg-white/10 md:block" aria-hidden="true">
            <m.div className="h-full origin-left bg-gradient-to-r from-cyan via-brand-400 to-violet" initial={{ scaleX: reduced ? 1 : 0 }} animate={{ scaleX: show ? 1 : 0 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
          </div>
          <ol className="relative grid gap-5 md:auto-cols-fr md:grid-flow-col md:gap-4">
            {steps.map((step, index) => (
              <m.li
                key={step.id ?? step.name}
                className="relative flex gap-4 md:flex-col md:items-center md:text-center"
                initial={reduced ? false : { opacity: 0, y: 20 }}
                animate={show ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.25 + index * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="relative z-10 flex h-[3.2rem] w-[3.2rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-brand-600 font-display text-lg font-semibold text-white shadow-[0_0_30px_-4px_rgba(41,182,246,0.6)] ring-4 ring-ink">
                  {index + 1}
                </span>
                <div className="glass-dark min-w-0 flex-1 rounded-2xl border p-4 md:mt-5 md:w-full md:p-5">
                  <h3 className="font-display font-semibold text-white">{step.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">{step.description}</p>
                </div>
              </m.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

InterviewSection.propTypes = { steps: PropTypes.array }

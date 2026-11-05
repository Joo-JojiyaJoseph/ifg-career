import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

let scriptPromise

function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Turnstile failed to load'))
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

/**
 * Invisible Turnstile. Calls onToken with a function that resolves a token, or an empty string when no site key is set.
 */
export function TurnstileField({ onToken }) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
  const containerRef = useRef(null)
  const widgetRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function token() {
      if (!siteKey || widgetRef.current == null || !window.turnstile) return ''
      return new Promise((resolve, reject) => {
        window.turnstile.execute(widgetRef.current, {
          callback: (value) => resolve(value),
          'error-callback': () => reject(new Error('Confirm you are not a robot and try again.')),
        })
      })
    }

    onToken(token)

    if (!siteKey) return undefined

    loadTurnstile().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetRef.current != null) return
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size: 'invisible',
      })
    }).catch(() => {})

    return () => {
      cancelled = true
    }
  }, [onToken, siteKey])

  return <div ref={containerRef} />
}

TurnstileField.propTypes = {
  onToken: PropTypes.func.isRequired,
}

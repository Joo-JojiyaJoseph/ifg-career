import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const ToastContext = createContext(null)

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast) => {
      const id = nextId++
      setToasts((current) => [...current, { id, tone: 'info', ...toast }])
      window.setTimeout(() => dismiss(id), toast.duration ?? 4000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:items-end"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-card ${toneClass(toast.tone)}`}
            role="status"
          >
            <span>{toast.message}</span>
            {toast.action ? (
              <button type="button" className="ml-3 min-h-11 font-medium underline" onClick={() => { toast.action.onClick(); dismiss(toast.id) }}>
                {toast.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function toneClass(tone) {
  if (tone === 'success') return 'bg-success'
  if (tone === 'error') return 'bg-danger'
  if (tone === 'warning') return 'bg-warning text-text'
  return 'bg-info'
}

// eslint-disable-next-line react-refresh/only-export-components -- hook shares the provider module
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

ToastProvider.propTypes = {
  children: PropTypes.node,
}

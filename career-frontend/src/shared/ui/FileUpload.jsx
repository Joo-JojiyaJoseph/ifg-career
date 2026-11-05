import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

const maxBytes = 5 * 1024 * 1024

/**
 * Drag-and-drop resume field. PDF or DOCX, 5 MB maximum.
 */
export function FileUpload({ id, file, existingName, onChange, invalid = false, describedBy }) {
  const inputRef = useRef(null)
  const [localError, setLocalError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  function take(next) {
    if (!next) {
      onChange(null)
      setLocalError('')
      return
    }
    const allowed = /\.(pdf|docx)$/i.test(next.name)
    if (!allowed) {
      setLocalError('Upload a PDF or DOCX file.')
      return
    }
    if (next.size > maxBytes) {
      setLocalError('The resume must be 5 MB or smaller.')
      return
    }
    setLocalError('')
    onChange(next)
  }

  const message = localError || null
  const label = file?.name || existingName || 'PDF or DOCX, up to 5 MB'

  return (
    <div>
      <button
        id={id}
        type="button"
        aria-describedby={describedBy}
        className={`flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-sm ${invalid || localError ? 'border-danger' : 'border-border'} ${dragOver ? 'bg-brand-50' : 'bg-white'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          take(event.dataTransfer.files?.[0] ?? null)
        }}
      >
        <ArrowUpTrayIcon className="h-6 w-6 text-brand-700" aria-hidden="true" />
        <span className="text-text">{label}</span>
        <span className="text-muted">Drop a file here or browse</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(event) => take(event.target.files?.[0] ?? null)}
      />
      {message ? <p className="mt-1.5 text-sm text-danger">{message}</p> : null}
    </div>
  )
}

FileUpload.propTypes = {
  id: PropTypes.string.isRequired,
  file: PropTypes.object,
  existingName: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  invalid: PropTypes.bool,
  describedBy: PropTypes.string,
}

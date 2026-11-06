import PropTypes from 'prop-types'
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline'
import { IconButton } from './IconButton'

/**
 * Ordered list with keyboard-friendly move up / move down buttons (no drag library needed).
 * `onReorder` receives the new array of ids.
 */
export function SortableList({ items, getId = (item) => item.id, renderItem, onReorder, disabled = false }) {
  function move(index, delta) {
    const next = [...items]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onReorder(next.map(getId))
  }

  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={getId(item)} className="flex items-stretch gap-2 rounded-2xl border border-border bg-white p-3 shadow-card transition duration-200">
          <div className="flex flex-col justify-center">
            <IconButton label="Move up" disabled={disabled || index === 0} onClick={() => move(index, -1)} className="disabled:opacity-30">
              <ArrowUpIcon className="h-4 w-4" />
            </IconButton>
            <IconButton label="Move down" disabled={disabled || index === items.length - 1} onClick={() => move(index, 1)} className="disabled:opacity-30">
              <ArrowDownIcon className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
        </li>
      ))}
    </ol>
  )
}

SortableList.propTypes = {
  items: PropTypes.array.isRequired,
  getId: PropTypes.func,
  renderItem: PropTypes.func.isRequired,
  onReorder: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

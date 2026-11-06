import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from './Tabs'

describe('Tabs', () => {
  it('marks the active tab and reports changes', () => {
    const onChange = vi.fn()
    render(<Tabs value="b" onChange={onChange} items={[{ id: 'a', label: 'All', count: 3 }, { id: 'b', label: 'Open' }]} />)
    expect(screen.getByRole('tab', { name: 'Open' }).getAttribute('aria-selected')).toBe('true')
    fireEvent.click(screen.getByRole('tab', { name: /All/ }))
    expect(onChange).toHaveBeenCalledWith('a')
  })
})

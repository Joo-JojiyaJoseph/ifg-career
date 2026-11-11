import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

const props = { perPage: 25, onPageChange: vi.fn(), onPerPageChange: vi.fn() }

describe('Pagination', () => {
  it('shows nothing when everything fits on one page', () => {
    const { container } = render(<Pagination {...props} page={1} pageCount={1} total={1} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the pages and the total when there is more than one page', () => {
    render(<Pagination {...props} page={1} pageCount={3} total={60} />)
    expect(screen.getByRole('button', { name: 'Page 2 of 3' })).toBeInTheDocument()
    expect(screen.getByText('1–25')).toBeInTheDocument()
  })

  it('keeps the page-size choice when a larger page size is what fits everything', () => {
    render(<Pagination {...props} perPage={50} page={1} pageCount={1} total={40} />)
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })
})

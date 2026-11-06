import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SafeHtml } from './SafeHtml'

describe('SafeHtml', () => {
  it('removes scripts, event handlers and javascript links', () => {
    const { container } = render(<SafeHtml html={'<p onclick="x()">Hello <script>alert(1)</script><a href="javascript:evil()">bad</a> <a href="https://infolksgroup.com">ok</a></p>'} />)
    expect(container.innerHTML).not.toContain('script')
    expect(container.innerHTML).not.toContain('onclick')
    expect(container.innerHTML).not.toContain('javascript:')
    expect(screen.getByText('ok').getAttribute('href')).toBe('https://infolksgroup.com')
  })
})

import { describe, expect, it } from 'vitest'
import { matchPageHost } from './createClient'

// jsdom serves the test page from http://localhost.
describe('matchPageHost', () => {
  it('uses the page host when both are loopback names', () => {
    expect(matchPageHost('http://127.0.0.1:8000')).toBe('http://localhost:8000')
    expect(matchPageHost('http://127.0.0.1:8000/api/v1/auth/google/redirect')).toBe('http://localhost:8000/api/v1/auth/google/redirect')
  })

  it('leaves real domains and matching hosts alone', () => {
    expect(matchPageHost('https://api.infolksgroup.com')).toBe('https://api.infolksgroup.com')
    expect(matchPageHost('http://localhost:8000')).toBe('http://localhost:8000')
  })
})

import { describe, expect, it } from 'vitest'
import { bodyOf } from './createClient'

describe('bodyOf', () => {
  it('keeps a parsed JSON body', () => {
    expect(bodyOf({ message: 'Nope' })).toEqual({ message: 'Nope' })
  })

  it('reads the JSON out of a body that starts with a PHP warning', () => {
    const raw = '<br />\n<b>Deprecated</b>: something in vendor/x.php on line 3<br />\n{"message":"There is already a company with this name.","errors":{"name":["There is already a company with this name."]}}'
    expect(bodyOf(raw).errors.name[0]).toBe('There is already a company with this name.')
  })

  it('returns an empty object for HTML or nothing', () => {
    expect(bodyOf('<html>413 Request Entity Too Large</html>')).toEqual({})
    expect(bodyOf(undefined)).toEqual({})
  })
})

import { sanitize, sanitizeObj } from '@/lib/sanitize'

describe('sanitize', () => {
  it('returns empty string for null input', () => {
    expect(sanitize(null)).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(sanitize(undefined)).toBe('')
  })

  it('returns empty string for number input', () => {
    expect(sanitize(42)).toBe('')
  })

  it('returns empty string for object input', () => {
    expect(sanitize({})).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(sanitize('')).toBe('')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitize('  hello  ')).toBe('hello')
  })

  it('escapes < character', () => {
    expect(sanitize('<')).toBe('&lt;')
  })

  it('escapes > character', () => {
    expect(sanitize('>')).toBe('&gt;')
  })

  it('escapes double quotes', () => {
    expect(sanitize('"quoted"')).toBe('&quot;quoted&quot;')
  })

  it("escapes single quotes", () => {
    expect(sanitize("it's")).toBe("it&#x27;s")
  })

  it('escapes full XSS script tag', () => {
    expect(sanitize('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    )
  })

  it('escapes combined attack: anchor tag with onclick', () => {
    expect(sanitize('<a href="x" onclick=\'evil()\'>click</a>')).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#x27;evil()&#x27;&gt;click&lt;/a&gt;'
    )
  })

  it('leaves safe alphanumeric strings unchanged', () => {
    expect(sanitize('Hello World 123')).toBe('Hello World 123')
  })
})

describe('sanitizeObj', () => {
  it('sanitizes specified string keys', () => {
    const obj = { name: '<b>Bold</b>', bio: 'safe' }
    const result = sanitizeObj(obj, ['name'])
    expect(result.name).toBe('&lt;b&gt;Bold&lt;/b&gt;')
    expect(result.bio).toBe('safe')
  })

  it('sanitizes multiple keys at once', () => {
    const obj = { name: '<b>', bio: '"quoted"' }
    const result = sanitizeObj(obj, ['name', 'bio'])
    expect(result.name).toBe('&lt;b&gt;')
    expect(result.bio).toBe('&quot;quoted&quot;')
  })

  it('skips non-string values even when key is specified', () => {
    const obj = { name: '<b>', count: 42 }
    const result = sanitizeObj(obj, ['name', 'count'])
    expect(result.count).toBe(42)
  })

  it('does not mutate the original object', () => {
    const obj = { name: '<script>' }
    sanitizeObj(obj, ['name'])
    expect(obj.name).toBe('<script>')
  })

  it('returns object with all keys intact', () => {
    const obj = { name: '<b>', role: 'admin', active: true }
    const result = sanitizeObj(obj, ['name'])
    expect(Object.keys(result)).toEqual(Object.keys(obj))
  })
})

export function sanitize(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

export function sanitizeObj<T extends Record<string, unknown>>(obj: T, keys: (keyof T)[]): T {
  const result = { ...obj }
  for (const key of keys) {
    if (typeof result[key] === 'string') {
      (result[key] as unknown) = sanitize(result[key] as string)
    }
  }
  return result
}

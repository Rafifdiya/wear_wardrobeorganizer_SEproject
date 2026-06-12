import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

// Use unique IPs per test to avoid state leakage between tests
let ipCounter = 0
const freshIp = () => `10.0.0.${++ipCounter}`

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const ip = freshIp()
    const result = checkRateLimit(ip)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('remaining decrements with each call', () => {
    const ip = freshIp()
    expect(checkRateLimit(ip).remaining).toBe(4)
    expect(checkRateLimit(ip).remaining).toBe(3)
    expect(checkRateLimit(ip).remaining).toBe(2)
  })

  it('allows exactly 5 attempts', () => {
    const ip = freshIp()
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip).allowed).toBe(true)
    }
  })

  it('blocks on the 6th attempt', () => {
    const ip = freshIp()
    for (let i = 0; i < 5; i++) checkRateLimit(ip)
    const result = checkRateLimit(ip)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('stays blocked on repeated calls after limit', () => {
    const ip = freshIp()
    for (let i = 0; i < 6; i++) checkRateLimit(ip)
    expect(checkRateLimit(ip).allowed).toBe(false)
    expect(checkRateLimit(ip).allowed).toBe(false)
  })

  it('different IPs are tracked independently', () => {
    const ip1 = freshIp()
    const ip2 = freshIp()
    for (let i = 0; i < 6; i++) checkRateLimit(ip1)
    expect(checkRateLimit(ip1).allowed).toBe(false)
    expect(checkRateLimit(ip2).allowed).toBe(true)
  })
})

describe('resetRateLimit', () => {
  it('allows requests again after reset', () => {
    const ip = freshIp()
    for (let i = 0; i < 6; i++) checkRateLimit(ip)
    expect(checkRateLimit(ip).allowed).toBe(false)
    resetRateLimit(ip)
    expect(checkRateLimit(ip).allowed).toBe(true)
  })

  it('reset on fresh IP has no side effects', () => {
    const ip = freshIp()
    resetRateLimit(ip)
    expect(checkRateLimit(ip).allowed).toBe(true)
    expect(checkRateLimit(ip).remaining).toBe(3)
  })
})

describe('rate limit window reset', () => {
  it('allows requests again after 15-minute window expires', () => {
    jest.useFakeTimers()
    const ip = freshIp()

    for (let i = 0; i < 5; i++) checkRateLimit(ip)
    expect(checkRateLimit(ip).allowed).toBe(false)

    jest.advanceTimersByTime(15 * 60 * 1000 + 1)

    const result = checkRateLimit(ip)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)

    jest.useRealTimers()
  })

  it('does not reset before window expires', () => {
    jest.useFakeTimers()
    const ip = freshIp()

    for (let i = 0; i < 5; i++) checkRateLimit(ip)
    expect(checkRateLimit(ip).allowed).toBe(false)

    jest.advanceTimersByTime(14 * 60 * 1000)

    expect(checkRateLimit(ip).allowed).toBe(false)

    jest.useRealTimers()
  })
})

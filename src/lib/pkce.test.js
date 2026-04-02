import { describe, it, expect } from 'vitest'
import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce.js'

describe('generateCodeVerifier', () => {
  it('returns a string', () => {
    expect(typeof generateCodeVerifier()).toBe('string')
  })

  it('is at least 43 characters (RFC 7636 minimum)', () => {
    expect(generateCodeVerifier().length).toBeGreaterThanOrEqual(43)
  })

  it('contains only URL-safe base64 characters', () => {
    expect(generateCodeVerifier()).toMatch(/^[A-Za-z0-9\-_]+$/)
  })

  it('produces a unique value on each call', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier())
  })
})

describe('generateCodeChallenge', () => {
  it('returns a string', async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier())
    expect(typeof challenge).toBe('string')
  })

  it('contains only URL-safe base64 characters', async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier())
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/)
  })

  it('is deterministic — same verifier always produces same challenge', async () => {
    const verifier = generateCodeVerifier()
    const [c1, c2] = await Promise.all([
      generateCodeChallenge(verifier),
      generateCodeChallenge(verifier),
    ])
    expect(c1).toBe(c2)
  })

  it('produces different challenges for different verifiers', async () => {
    const [c1, c2] = await Promise.all([
      generateCodeChallenge(generateCodeVerifier()),
      generateCodeChallenge(generateCodeVerifier()),
    ])
    expect(c1).not.toBe(c2)
  })

  it('does not contain base64 padding characters', async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier())
    expect(challenge).not.toContain('=')
  })
})

describe('generateState', () => {
  it('returns a string', () => {
    expect(typeof generateState()).toBe('string')
  })

  it('produces a unique value on each call', () => {
    expect(generateState()).not.toBe(generateState())
  })

  it('contains only URL-safe base64 characters', () => {
    expect(generateState()).toMatch(/^[A-Za-z0-9\-_]+$/)
  })
})

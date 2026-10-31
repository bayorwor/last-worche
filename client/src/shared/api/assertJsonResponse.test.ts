import { describe, expect, test } from 'bun:test'
import { assertJsonResponse } from './assertJsonResponse.ts'

describe('assertJsonResponse', () => {
  test('accepts JSON, with or without a charset', () => {
    expect(() => assertJsonResponse('application/json')).not.toThrow()
    expect(() => assertJsonResponse('application/json; charset=utf-8')).not.toThrow()
  })

  test('rejects an HTML page answered with status 200', () => {
    expect(() => assertJsonResponse('text/html')).toThrow()
  })

  test('rejects a missing content type', () => {
    expect(() => assertJsonResponse(undefined)).toThrow()
  })
})

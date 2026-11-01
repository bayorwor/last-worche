import { describe, expect, test } from 'bun:test'
import { assertApiResponse } from './assertApiResponse.ts'

describe('assertApiResponse', () => {
  test('accepts JSON, with or without a charset', () => {
    expect(() => assertApiResponse('application/json')).not.toThrow()
    expect(() => assertApiResponse('application/json; charset=utf-8')).not.toThrow()
  })

  test('accepts a CSV download', () => {
    expect(() => assertApiResponse('text/csv; charset=utf-8')).not.toThrow()
  })

  test('rejects an HTML page answered with status 200', () => {
    expect(() => assertApiResponse('text/html')).toThrow()
  })

  test('rejects a missing content type', () => {
    expect(() => assertApiResponse(undefined)).toThrow()
  })
})

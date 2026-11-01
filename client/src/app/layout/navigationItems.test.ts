import { describe, expect, test } from 'bun:test'
import { ROLE_HOME_PATHS } from '../routePaths.ts'
import { ROLE_NAVIGATION } from './navigationItems.ts'

describe('ROLE_NAVIGATION', () => {
  test("each role's first tab is its home page", () => {
    for (const [role, items] of Object.entries(ROLE_NAVIGATION)) {
      expect(items[0]?.path).toBe(ROLE_HOME_PATHS[role as keyof typeof ROLE_HOME_PATHS])
    }
  })

  test("a role's tabs stay under its own home page", () => {
    for (const [role, items] of Object.entries(ROLE_NAVIGATION)) {
      const home = ROLE_HOME_PATHS[role as keyof typeof ROLE_HOME_PATHS]
      expect(items.every((item) => item.path.startsWith(home))).toBe(true)
    }
  })
})

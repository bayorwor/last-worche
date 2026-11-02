import type { MessageKey } from '../../shared/i18n/messages/de.ts'
import type { RadarFlagKind } from './budgetTypes.ts'

// The name of each kind of radar flag, so the pattern is always named in words, never shown by colour alone.
export const RADAR_KIND_KEYS: Record<RadarFlagKind, MessageKey> = {
  'frequent-long-days': 'radar.kindFrequentLongDays',
  'weekend-work': 'radar.kindWeekendWork',
  'pace-jump': 'radar.kindPaceJump',
  'just-under-limit': 'radar.kindJustUnderLimit',
}

import type { MessageKey } from '../../shared/i18n/messages/de.ts'
import type { InvoiceCheckResult } from './purchasingTypes.ts'

export const INVOICE_STATUS_KEYS: Record<InvoiceCheckResult['status'], MessageKey> = {
  consistent: 'invoice.statusConsistent',
  'over-approved': 'invoice.statusOver',
  'under-approved': 'invoice.statusUnder',
}

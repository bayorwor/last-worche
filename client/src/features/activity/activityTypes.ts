export type ActivityType =
  | 'signed_in'
  | 'profile_updated'
  | 'booking_created'
  | 'proof_approved'
  | 'follow_up_requested'
  | 'follow_up_confirmed'
  | 'follow_up_declined'
  | 'invoice_recorded'

// The server decides what each role receives: for purchasing, actorName is null on anyone else's entry.
export type Activity = {
  id: number
  type: ActivityType
  occurredAtMs: number
  isOwn: boolean
  actorName: string | null
  orderId: string | null
  period: string | null
  hours: number | null
}

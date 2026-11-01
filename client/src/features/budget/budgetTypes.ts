export type OrderBooking = {
  id: number
  consultantName: string
  date: string
  startTime: string
  endTime: string
  hours: number
  description: string
}

export type ProofOfWork = {
  month: string
  personDays: number
  bookingCount: number
  consultantCount: number
  status: 'open' | 'approved'
  approvedAtMs: number | null
  approvedByName: string | null
}

export type OrderBudget = {
  orderId: string
  orderedPersonDays: number
  usedPersonDays: number
  freePersonDays: number
}

export type IsoWeek = { year: number; week: number }

export type ForecastPoint = { date: string; remainingPersonDays: number }

export type ForecastResult = {
  exhaustionDate: string | null
  exhaustionWeek: IsoWeek | null
  projectEndDate: string
  remainingAtProjectEndPersonDays: number
  warning: { orderByDate: string; orderByWeek: IsoWeek; isOverdue: boolean; followUpPersonDays: number } | null
  series: ForecastPoint[]
  assumptions: {
    pacePersonDaysPerWeek: number
    consultantCount: number
    holidayDays: number
    vacationDays: number
    shutdownDays: number
    paceWindowWeeks: number
    purchasingLeadWeeks: number
  }
}

export type OpenFollowUp = { personDays: number; neededByDate: string }

export type OrderForecast =
  | { status: 'not-enough-data'; freePersonDays: number; openFollowUp: OpenFollowUp | null }
  | { status: 'ok'; freePersonDays: number; openFollowUp: OpenFollowUp | null; base: ForecastResult; scenario: ForecastResult | null }

// Only a what-if view: it goes along in the request, and nothing about it is stored.
export type ForecastScenario = {
  extraConsultants?: number
  extraFromDate?: string
  projectEndShiftWeeks?: number
}

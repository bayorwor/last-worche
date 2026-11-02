import { useAppSelector } from '../../../app/storeHooks.ts'
import { RadarFlagTable } from '../components/RadarFlagTable.tsx'
import { useSelectedOrderId } from '../useSelectedOrderId.ts'

export default function OrderRadarPage() {
  const orderId = useSelectedOrderId()
  const radarsByOrderId = useAppSelector((state) => state.budget.radarsByOrderId)
  const radar = orderId ? radarsByOrderId[orderId] : undefined

  return orderId && radar ? <RadarFlagTable orderId={orderId} radar={radar} /> : null
}

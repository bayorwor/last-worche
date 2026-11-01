import { useOutletContext } from 'react-router'

// The order chosen on ProjectLeadDashboardPage, which all of its tabs share.
export function useSelectedOrderId() {
  return useOutletContext<string | undefined>()
}

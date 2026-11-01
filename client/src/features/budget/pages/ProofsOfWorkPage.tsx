import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { approveProofOfWork } from '../budgetSlice.ts'
import { ProofOfWorkPanel } from '../components/ProofOfWorkPanel.tsx'
import { useSelectedOrderId } from '../useSelectedOrderId.ts'

export default function ProofsOfWorkPage() {
  const dispatch = useAppDispatch()
  const orderId = useSelectedOrderId()
  const { proofsByOrderId, approvalStatus } = useAppSelector((state) => state.budget)
  const proofs = orderId ? proofsByOrderId[orderId] : undefined

  if (!orderId || !proofs) {
    return null
  }
  return (
    <ProofOfWorkPanel
      proofs={proofs}
      isApproving={approvalStatus === 'loading'}
      onApprove={(month) => dispatch(approveProofOfWork({ orderId, month }))}
    />
  )
}

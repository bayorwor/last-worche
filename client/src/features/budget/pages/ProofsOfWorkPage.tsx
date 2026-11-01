import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { getApiError, type ApiError } from '../../../shared/api/getApiError.ts'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { downloadFile } from '../../../shared/utils/downloadFile.ts'
import { requestProofCsv } from '../budgetApi.ts'
import { approveProofOfWork } from '../budgetSlice.ts'
import { ProofOfWorkPanel } from '../components/ProofOfWorkPanel.tsx'
import { useSelectedOrderId } from '../useSelectedOrderId.ts'

export default function ProofsOfWorkPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const [downloadError, setDownloadError] = useState<ApiError | null>(null)
  const orderId = useSelectedOrderId()
  const { proofsByOrderId, approvalStatus } = useAppSelector((state) => state.budget)
  const proofs = orderId ? proofsByOrderId[orderId] : undefined

  if (!orderId || !proofs) {
    return null
  }

  async function download(month: string) {
    setDownloadError(null)
    try {
      downloadFile(await requestProofCsv(orderId as string, month), `proof-of-work-${orderId}-${month}.csv`)
    } catch (error) {
      setDownloadError(getApiError(error))
    }
  }

  return (
    <>
      {downloadError && (
        <StatusMessage tone="error" className="mb-4">
          {t(downloadError.key, downloadError.values)}
        </StatusMessage>
      )}
      <ProofOfWorkPanel
        proofs={proofs}
        isApproving={approvalStatus === 'loading'}
        onApprove={(month) => dispatch(approveProofOfWork({ orderId, month }))}
        onDownload={download}
      />
    </>
  )
}

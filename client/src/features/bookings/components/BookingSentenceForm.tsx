import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/components/Button.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'

type BookingSentenceFormProps = {
  isSubmitting: boolean
  onSubmit: (sentence: string) => void
  onEnterByHand: () => void
}

export function BookingSentenceForm({ isSubmitting, onSubmit, onEnterByHand }: BookingSentenceFormProps) {
  const { t } = useTranslation()
  const [sentence, setSentence] = useState('')
  const trimmedSentence = sentence.trim()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(trimmedSentence)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="booking-sentence" className="block text-sm font-semibold">
        {t('bookings.sentenceLabel')}
      </label>
      <input
        id="booking-sentence"
        type="text"
        value={sentence}
        maxLength={500}
        placeholder={t('bookings.sentencePlaceholder')}
        onChange={(event) => setSentence(event.target.value)}
        className="mt-2 min-h-11 w-full border border-ink bg-paper px-3.5 py-3 text-base placeholder:text-muted"
      />
      <div className="mt-3 flex flex-wrap gap-2.5">
        <Button type="submit" disabled={!trimmedSentence || isSubmitting}>
          {isSubmitting ? t('bookings.checkingProposal') : t('bookings.checkProposal')}
        </Button>
        <Button variant="ghost" onClick={onEnterByHand}>
          {t('bookings.enterByHand')}
        </Button>
      </div>
    </form>
  )
}

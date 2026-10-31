import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/components/Button.tsx'

type BookingSentenceFormProps = {
  isSubmitting: boolean
  onSubmit: (sentence: string) => void
}

export function BookingSentenceForm({ isSubmitting, onSubmit }: BookingSentenceFormProps) {
  const [sentence, setSentence] = useState('')
  const trimmedSentence = sentence.trim()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(trimmedSentence)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="booking-sentence" className="block text-sm font-semibold">
        Was haben Sie gearbeitet?
      </label>
      <input
        id="booking-sentence"
        type="text"
        value={sentence}
        maxLength={500}
        placeholder="9 bis 5 am Kundenportal, 1 h Mittag"
        onChange={(event) => setSentence(event.target.value)}
        className="mt-2 min-h-11 w-full border border-ink bg-paper px-3.5 py-3 text-base placeholder:text-muted"
      />
      <Button type="submit" className="mt-3" disabled={!trimmedSentence || isSubmitting}>
        {isSubmitting ? 'Wird geprüft …' : 'Vorschlag prüfen'}
      </Button>
    </form>
  )
}

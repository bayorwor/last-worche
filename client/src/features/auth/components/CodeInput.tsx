import { useEffect, useRef } from 'react'

export const CODE_LENGTH = 6

type CodeInputProps = {
  id: string
  value: string
  isInvalid: boolean
  isDisabled: boolean
  onChange: (code: string) => void
}

// Looks like six boxes, but is one real input lying on top of them. Paste, iOS code autofill,
// deleting and screen readers therefore all work without any extra code.
export function CodeInput({ id, value, isInvalid, isDisabled, onChange }: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Puts the cursor here on arriving, and again after a wrong code emptied the field.
  useEffect(() => {
    if (value === '' && !isDisabled) {
      inputRef.current?.focus()
    }
  }, [value, isDisabled])

  return (
    <div className="group relative mt-2">
      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, position) => {
          const isCurrent = position === Math.min(value.length, CODE_LENGTH - 1)
          const borderClass = isInvalid
            ? 'border-signal-strong'
            : isCurrent
              ? 'border-ink group-focus-within:border-brand group-focus-within:outline-2 group-focus-within:outline-brand'
              : 'border-ink'
          return (
            <div
              key={position}
              className={`flex h-14 items-center justify-center border bg-panel text-2xl font-bold tabular-nums ${borderClass}`}
            >
              {value[position] ?? ''}
            </div>
          )
        })}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        value={value}
        disabled={isDisabled}
        aria-invalid={isInvalid}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent"
      />
    </div>
  )
}

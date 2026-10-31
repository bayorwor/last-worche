import type { ComponentProps } from 'react'

type ButtonVariant = 'primary' | 'brand' | 'signal' | 'ghost'

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-ink font-bold text-white hover:bg-muted',
  brand: 'bg-brand font-bold text-white hover:bg-brand-strong',
  signal: 'bg-signal font-bold text-white hover:bg-signal-strong',
  ghost: 'border border-ink hover:bg-neutral-soft',
}

export function Button({ variant = 'primary', type = 'button', className = '', ...buttonProps }: ButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-11 cursor-pointer px-4.5 py-2.5 text-sm transition-colors duration-200 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...buttonProps}
    />
  )
}

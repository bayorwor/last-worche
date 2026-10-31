import { useTranslation } from '../../../shared/i18n/languageContext.ts'

const BENEFIT_KEYS = ['signIn.benefitRules', 'signIn.benefitBudget', 'signIn.benefitPrivacy'] as const

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  )
}

// A phone shows a short band above the form, and larger screens a full panel beside it.
export function SignInBrandPanel() {
  const { t } = useTranslation()

  return (
    <aside className="relative overflow-hidden bg-brand px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 text-white lg:flex lg:min-h-dvh lg:flex-col lg:justify-between lg:p-12">
      <img
        src="/logo-mark-white.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 bottom-0 hidden size-[30rem] opacity-[0.08] lg:block"
      />
      <img src="/logo-on-crimson.svg" alt="lastWorche" width={328} height={96} className="relative h-12 w-auto self-start lg:h-14" />
      <div className="relative mt-5 max-w-lg lg:mt-0">
        <p className="text-2xl leading-tight font-extrabold lg:text-4xl">{t('signIn.headline')}</p>
        <ul className="mt-8 hidden gap-4 text-base lg:grid">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} className="flex gap-3">
              <CheckIcon />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative mt-10 hidden text-sm text-white/85 lg:block">{t('header.demoNotice')}</p>
    </aside>
  )
}

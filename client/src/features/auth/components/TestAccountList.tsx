import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { TestAccount } from '../authTypes.ts'
import { useRoleText } from '../useRoleText.ts'

type TestAccountListProps = {
  accounts: TestAccount[]
  selectedEmail: string
  onSelect: (email: string) => void
}

// Choosing an account only fills in the email, so testers still go through the real sign-in.
export function TestAccountList({ accounts, selectedEmail, onSelect }: TestAccountListProps) {
  const { t } = useTranslation()
  const roleText = useRoleText()

  return (
    <section aria-labelledby="test-accounts-title" className="mt-8 border-t border-line pt-6">
      <h2 id="test-accounts-title" className="text-xs font-semibold tracking-widest text-muted uppercase">
        {t('signIn.testAccountsTitle')}
      </h2>
      <p className="mt-2 text-sm text-muted">{t('signIn.testAccountsHint')}</p>
      <ul className="mt-4 grid gap-2">
        {accounts.map((account) => {
          const isSelected = account.email === selectedEmail
          return (
            <li key={account.email}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(account.email)}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 border px-3.5 py-2.5 text-left transition-colors duration-200 motion-reduce:transition-none ${
                  isSelected ? 'border-brand bg-brand-soft' : 'border-line bg-panel hover:border-ink'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{account.name}</span>
                  <span className="block truncate text-xs text-muted">{account.email}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-brand">{roleText(account.role).name}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

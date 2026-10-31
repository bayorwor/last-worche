import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { DemoUser } from '../authTypes.ts'
import { ROLE_MESSAGE_KEYS } from '../roleMessageKeys.ts'

type DemoUserListProps = {
  users: DemoUser[]
  isSigningIn: boolean
  onSelect: (userId: string) => void
}

export function DemoUserList({ users, isSigningIn, onSelect }: DemoUserListProps) {
  const { t } = useTranslation()

  return (
    <ul className="grid gap-2.5">
      {users.map(({ id, name, role }) => (
        <li key={id}>
          <button
            type="button"
            disabled={isSigningIn}
            onClick={() => onSelect(id)}
            className="min-h-11 w-full cursor-pointer border border-ink bg-paper px-4 py-3 text-left transition-colors duration-200 hover:bg-neutral-soft disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            <span className="block text-sm font-bold">
              {name} · {t(ROLE_MESSAGE_KEYS[role].title)}
            </span>
            <span className="block text-xs text-muted">{t(ROLE_MESSAGE_KEYS[role].subtitle)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

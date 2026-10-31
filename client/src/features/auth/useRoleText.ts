import { useAppSelector } from '../../app/storeHooks.ts'
import { useTranslation } from '../../shared/i18n/languageContext.ts'
import type { UserRole } from './authTypes.ts'

// A role's name and description in the current language, as the backend provides them.
export function useRoleText() {
  const { language } = useTranslation()
  const roles = useAppSelector((state) => state.auth.roles)

  return function roleText(roleId: UserRole) {
    const role = roles.find(({ id }) => id === roleId)
    return { name: role?.names[language] ?? '', summary: role?.summaries[language] ?? '' }
  }
}

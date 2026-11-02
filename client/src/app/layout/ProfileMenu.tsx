// Who is signed in, and what they can do with their account. It follows the usual menu button pattern:
// arrow keys, Home and End move between items, Escape closes and returns to the button, Tab or a click outside closes.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { profileEditStarted, signedOut } from '../../features/auth/authSlice.ts'
import type { SessionUser } from '../../features/auth/authTypes.ts'
import { useRoleText } from '../../features/auth/useRoleText.ts'
import { clearSessionToken } from '../../shared/api/sessionToken.ts'
import { useTranslation } from '../../shared/i18n/languageContext.ts'
import { useAppDispatch } from '../storeHooks.ts'
import { RECENT_ACTIVITY_ID } from './layoutTargets.ts'
import { initialsOf, nextMenuIndex } from './profileMenuHelpers.ts'

const ITEM_CLASSES =
  'flex min-h-11 w-full cursor-pointer items-center px-4 py-2.5 text-left text-sm transition-colors duration-200 hover:bg-neutral-soft focus-visible:bg-neutral-soft focus-visible:-outline-offset-2 motion-reduce:transition-none'

export function ProfileMenu({ user }: { user: SessionUser }) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const roleText = useRoleText()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const roleName = roleText(user.role).name

  function menuItems() {
    return Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
  }

  useEffect(() => {
    if (!isOpen) return

    menuItems()[0]?.focus()

    function closeOnOutsidePress(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [isOpen])

  function moveFocus(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
      return
    }
    if (event.key === 'Tab') {
      setIsOpen(false)
      return
    }
    const items = menuItems()
    const nextIndex = nextMenuIndex(items.indexOf(document.activeElement as HTMLElement), event.key, items.length)
    if (nextIndex !== null) {
      event.preventDefault()
      items[nextIndex]?.focus()
    }
  }

  function openWithArrowKey(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  function editProfile() {
    setIsOpen(false)
    dispatch(profileEditStarted())
  }

  function showRecentActivity() {
    setIsOpen(false)
    document.getElementById(RECENT_ACTIVITY_ID)?.focus()
  }

  function signOut() {
    clearSessionToken()
    dispatch(signedOut())
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${t('profileMenu.label')}: ${user.name}, ${roleName}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={openWithArrowKey}
        className="flex min-h-11 max-w-64 cursor-pointer items-center gap-2.5 border border-ink pr-2 transition-colors duration-200 hover:bg-neutral-soft motion-reduce:transition-none"
      >
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center bg-ink text-xs font-bold text-white">
          {initialsOf(user.name)}
        </span>
        <span className="hidden min-w-0 text-left leading-tight lg:block">
          <span className="block truncate text-sm font-bold">{user.name}</span>
          <span className="block truncate text-xs text-muted">{roleName}</span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] border border-ink bg-panel shadow-md">
          <div className="border-b border-line px-4 py-3 text-sm">
            <p className="font-bold break-words">{user.name}</p>
            <p className="mt-0.5 break-words text-muted">{user.email}</p>
            <p className="mt-0.5 text-muted">{roleName}</p>
          </div>
          <div ref={menuRef} role="menu" aria-label={t('profileMenu.label')} onKeyDown={moveFocus}>
            <button type="button" role="menuitem" tabIndex={-1} onClick={editProfile} className={ITEM_CLASSES}>
              {t('profileMenu.editProfile')}
            </button>
            <button type="button" role="menuitem" tabIndex={-1} onClick={showRecentActivity} className={ITEM_CLASSES}>
              {t('activity.panelTitle')}
            </button>
            <div role="separator" className="border-t border-line" />
            <button type="button" role="menuitem" tabIndex={-1} onClick={signOut} className={`${ITEM_CLASSES} font-bold`}>
              {t('session.signOut')}
            </button>
          </div>
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted sm:hidden">{t('header.demoNotice')}</p>
        </div>
      )}
    </div>
  )
}

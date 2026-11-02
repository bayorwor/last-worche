// What the profile menu decides by itself, kept apart from React so it can be tested without a browser.

// The first letters of the first and last word: "L. Hoffmann" is LH, and "Mira" is M.
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = Array.from(words[0] ?? '')[0] ?? ''
  const last = words.length > 1 ? (Array.from(words[words.length - 1] ?? '')[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

// Which item a key moves the focus to, wrapping at both ends. Null means the key does not move it.
export function nextMenuIndex(currentIndex: number, key: string, itemCount: number) {
  if (itemCount === 0) return null
  if (key === 'ArrowDown') return (currentIndex + 1) % itemCount
  if (key === 'ArrowUp') return (currentIndex - 1 + itemCount) % itemCount
  if (key === 'Home') return 0
  if (key === 'End') return itemCount - 1
  return null
}

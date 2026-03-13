import { useState, useCallback } from 'react'
import type { CachedPlayer } from '../types'

const STORAGE_KEY = 'the-scouter-recent'
const MAX_RECENT = 10

function loadRecent(): CachedPlayer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(players: CachedPlayer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<CachedPlayer[]>(loadRecent)

  const addRecent = useCallback(
    (player: CachedPlayer) => {
      const filtered = recent.filter(
        (p) => p.data.fullName !== player.data.fullName
      )
      const updated = [player, ...filtered].slice(0, MAX_RECENT)
      setRecent(updated)
      saveRecent(updated)
    },
    [recent]
  )

  const getFromCache = useCallback(
    (name: string): CachedPlayer | undefined => {
      return recent.find(
        (p) => p.data.fullName === name || p.data.fullName.includes(name)
      )
    },
    [recent]
  )

  return { recent, addRecent, getFromCache }
}

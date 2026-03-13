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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  } catch {
    // storage full or unavailable; in-memory state remains correct
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<CachedPlayer[]>(loadRecent)

  const addRecent = useCallback((player: CachedPlayer) => {
    setRecent((prev) => {
      const filtered = prev.filter(
        (p) => p.data.fullName !== player.data.fullName
      )
      const updated = [player, ...filtered].slice(0, MAX_RECENT)
      saveRecent(updated)
      return updated
    })
  }, [])

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

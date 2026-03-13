import { useState, useRef, useEffect } from 'react'
import styles from './SearchBar.module.css'
import players from '../data/players.json'
import type { AutocompletePlayer } from '../types'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading: boolean
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompletePlayer[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    const filtered = (players as AutocompletePlayer[]).filter((p) =>
      p.name.includes(query)
    )
    setSuggestions(filtered.slice(0, 8))
    setSelectedIndex(-1)
  }, [query])

  const handleSubmit = (value?: string) => {
    const searchQuery = value ?? query
    if (!searchQuery.trim()) return
    onSearch(searchQuery.trim())
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        setQuery(suggestions[selectedIndex].name)
        handleSubmit(suggestions[selectedIndex].name)
      } else {
        handleSubmit()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <button
          className={styles.searchButton}
          onClick={() => handleSubmit()}
          disabled={isLoading}
        >
          {isLoading ? <span className={styles.spinner} /> : '🔍'}
        </button>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="הקלד שם שחקן..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          disabled={isLoading}
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map((player, index) => (
            <li
              key={player.name}
              className={`${styles.suggestion} ${index === selectedIndex ? styles.selected : ''}`}
              onMouseDown={() => {
                setQuery(player.name)
                handleSubmit(player.name)
              }}
            >
              {player.name} {player.flag}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

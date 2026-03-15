import { useRef, useState, useEffect } from 'react'
import styles from './ProfileCarousel.module.css'
import type { PlayerData } from '../types'
import TrophyCabinet from './TrophyCabinet'
import PlayingStyleChart from './PlayingStyleChart'
import CareerTimeline from './CareerTimeline'
import SimilarPlayers from './SimilarPlayers'
import IconicMoments from './IconicMoments'

interface Tab {
  id: string
  label: string
  color: string
  borderColor: string
}

const TABS: Tab[] = [
  { id: 'trophies', label: '🏆 גביעים', color: 'rgba(250,204,21,0.3)', borderColor: 'rgba(250,204,21,0.4)' },
  { id: 'style', label: '⚡ סגנון', color: 'rgba(34,211,238,0.15)', borderColor: 'rgba(34,211,238,0.3)' },
  { id: 'timeline', label: '📅 ציר זמן', color: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)' },
  { id: 'similar', label: '🔗 דומים', color: 'rgba(74,222,128,0.15)', borderColor: 'rgba(74,222,128,0.3)' },
  { id: 'moments', label: '🎬 רגעים', color: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.3)' },
]

const TAB_ACTIVE_COLORS: Record<string, string> = {
  trophies: '#fbbf24',
  style: '#22d3ee',
  timeline: '#a78bfa',
  similar: '#4ade80',
  moments: '#fb7185',
}

interface Props {
  player: PlayerData
  onPlayerSearch: (query: string) => void
}

export default function ProfileCarousel({ player, onPlayerSearch }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  // Filter tabs to only those with data
  const availableTabs = TABS.filter((tab) => {
    switch (tab.id) {
      case 'trophies': return player.trophies && player.trophies.length > 0
      case 'style': return player.playingStyle
      case 'timeline': return player.timeline && player.timeline.length > 0
      case 'similar': return player.similarPlayers && player.similarPlayers.length > 0
      case 'moments': return player.iconicMoments && player.iconicMoments.length > 0
      default: return false
    }
  })

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.indexOf(entry.target as HTMLDivElement)
            if (index !== -1) setActiveIndex(index)
          }
        })
      },
      { root: carousel, threshold: 0.5 }
    )

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide)
    })

    return () => observer.disconnect()
  }, [availableTabs.length])

  if (availableTabs.length === 0) return null

  const scrollToSlide = (index: number) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {availableTabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${i === activeIndex ? styles.active : ''}`}
            style={{
              background: i === activeIndex ? tab.color : 'rgba(255,255,255,0.08)',
              borderColor: tab.borderColor,
              color: TAB_ACTIVE_COLORS[tab.id],
            }}
            onClick={() => scrollToSlide(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div ref={carouselRef} className={styles.carousel}>
        {availableTabs.map((tab, i) => (
          <div
            key={tab.id}
            ref={(el) => { slideRefs.current[i] = el }}
            className={styles.slide}
          >
            {tab.id === 'trophies' && player.trophies && <TrophyCabinet trophies={player.trophies} />}
            {tab.id === 'style' && player.playingStyle && <PlayingStyleChart style={player.playingStyle} />}
            {tab.id === 'timeline' && player.timeline && <CareerTimeline events={player.timeline} />}
            {tab.id === 'similar' && player.similarPlayers && <SimilarPlayers players={player.similarPlayers} onSearch={onPlayerSearch} />}
            {tab.id === 'moments' && player.iconicMoments && <IconicMoments moments={player.iconicMoments} />}
          </div>
        ))}
      </div>

    </div>
  )
}

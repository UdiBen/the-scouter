import { useState, useRef, useEffect } from 'react'
import styles from './PlayerCard.module.css'
import type { PlayerData } from '../types'

interface PlayerCardProps {
  player: PlayerData
  imageUrl: string | null
  onDismiss?: () => void
}

export default function PlayerCard({ player, imageUrl, onDismiss }: PlayerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState(400)

  useEffect(() => {
    const updateHeight = () => {
      const frontH = frontRef.current?.scrollHeight ?? 0
      const backH = backRef.current?.scrollHeight ?? 0
      setCardHeight(Math.max(frontH, backH) + 16)
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [player])

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
        style={{ height: cardHeight }}
        onClick={() => setIsFlipped((f) => !f)}
      >
        {/* Front */}
        <div ref={frontRef} className={styles.front}>
          {onDismiss && (
            <button
              className={styles.dismissBtn}
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              aria-label="סגור"
            >
              ✕
            </button>
          )}
          <button
            className={styles.flipHint}
            onClick={(e) => {
              e.stopPropagation()
              setIsFlipped(true)
            }}
          >
            👆 הפוך
          </button>

          <div className={styles.photoContainer}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={player.fullName}
                className={styles.photo}
              />
            ) : (
              <span className={styles.photoFallback}>{player.nationalityFlag}</span>
            )}
          </div>

          <h2 className={styles.name}>{player.displayName || player.fullName}</h2>
          <p className={styles.nationality}>
            {player.nationalityFlag} {player.nationality}
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{player.age}</span>
              <span className={styles.statLabel}>גיל</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{player.position}</span>
              <span className={styles.statLabel}>עמדה</span>
            </div>
            {player.shirtNumber != null && (
              <div className={styles.stat}>
                <span className={styles.statValue}>{player.shirtNumber}</span>
                <span className={styles.statLabel}>מספר</span>
              </div>
            )}
            {player.status && (
              <div className={styles.stat}>
                <span className={styles.statValue}>{player.status}</span>
                <span className={styles.statLabel}>סטטוס</span>
              </div>
            )}
          </div>

          <div className={styles.funFact}>
            <span className={styles.funFactLabel}>💡 הידעת?</span>
            <p className={styles.funFactText}>{player.funFact}</p>
          </div>

          {player.personalLife && (
            <div className={styles.personalLife}>
              <span className={styles.personalLifeLabel}>🔥 חיים אישיים</span>
              <p className={styles.personalLifeText}>{player.personalLife}</p>
            </div>
          )}
        </div>

        {/* Back */}
        <div ref={backRef} className={styles.back}>
          {onDismiss && (
            <button
              className={styles.dismissBtn}
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              aria-label="סגור"
            >
              ✕
            </button>
          )}
          <button
            className={styles.flipHint}
            onClick={(e) => {
              e.stopPropagation()
              setIsFlipped(false)
            }}
          >
            👆 הפוך
          </button>

          <h2 className={styles.name}>{player.displayName || player.fullName}</h2>
          <p className={styles.careerTitle}>⚽ קריירה</p>

          <div className={styles.careerTable}>
            <div className={styles.careerHeader}>
              <span>בישולים</span>
              <span>שערים</span>
              <span>הופעות</span>
              <span>שנים</span>
              <span className={styles.clubCol}>קבוצה</span>
            </div>
            {player.career.map((entry, i) => {
              const isNational = i === player.career.length - 1
              return (
                <div
                  key={`${entry.club}-${entry.years}`}
                  className={`${styles.careerRow} ${isNational ? styles.nationalRow : ''}`}
                >
                  <span>{entry.assists ?? '—'}</span>
                  <span>{entry.goals}</span>
                  <span>{entry.appearances}</span>
                  <span className={styles.years}>{entry.years}</span>
                  <span className={styles.clubCol}>
                    <span
                      className={styles.clubDot}
                      style={{ background: entry.clubColor }}
                    />
                    {entry.club}
                  </span>
                </div>
              )
            })}
          </div>

          <div className={styles.achievements}>
            <span className={styles.achievementsLabel}>🏆 הישגים</span>
            <ul className={styles.achievementsList}>
              {player.achievements.split(/\s*·\s*|[,،]\s*|\n/).filter(Boolean).map((item, i) => (
                <li key={i}>{item.trim()}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className={styles.disclaimer}>
        * הנתונים מבוססים על AI ועשויים להיות לא מדויקים
      </p>
    </div>
  )
}

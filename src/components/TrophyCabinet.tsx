import styles from './TrophyCabinet.module.css'
import type { Trophy } from '../types'

const CATEGORY_LABELS: Record<string, string> = {
  league: 'ליגה',
  europe: 'אירופה',
  international: 'בינלאומי',
  individual: 'אישי',
}

const CATEGORY_ORDER = ['league', 'europe', 'international', 'individual']

interface Props {
  trophies: Trophy[]
}

export default function TrophyCabinet({ trophies }: Props) {
  const grouped = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      items: trophies.filter((t) => t.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className={styles.container}>
      {grouped.map((group) => (
        <div key={group.category} className={styles.category}>
          <div className={styles.categoryLabel}>{CATEGORY_LABELS[group.category]}</div>
          <div className={styles.trophies}>
            {group.items.map((trophy, i) => (
              <div key={i} className={styles.trophy}>
                <div className={styles.trophyEmoji}>{trophy.emoji}</div>
                <div className={styles.trophyName}>{trophy.name}</div>
                {trophy.count > 1 && <div className={styles.trophyCount}>x{trophy.count}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

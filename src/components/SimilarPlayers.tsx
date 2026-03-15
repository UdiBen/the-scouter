import styles from './SimilarPlayers.module.css'
import type { SimilarPlayer } from '../types'

interface Props {
  players: SimilarPlayer[]
  onSearch: (query: string) => void
}

export default function SimilarPlayers({ players, onSearch }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {players.map((p, i) => (
          <button key={i} className={styles.card} onClick={() => onSearch(p.englishName)}>
            <div className={styles.flag}>{p.flag}</div>
            <div className={styles.name}>{p.name}</div>
            <div className={styles.relation}>{p.relation}</div>
          </button>
        ))}
      </div>
      <div className={styles.hint}>👆 לחץ על שחקן כדי לחפש אותו</div>
    </div>
  )
}

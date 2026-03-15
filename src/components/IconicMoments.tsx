import styles from './IconicMoments.module.css'
import type { IconicMoment } from '../types'

interface Props {
  moments: IconicMoment[]
}

export default function IconicMoments({ moments }: Props) {
  return (
    <div className={styles.container}>
      {moments.map((m, i) => (
        <div key={i} className={styles.moment}>
          <div className={styles.header}>
            <span className={styles.match}>{m.year} · {m.match}</span>
            <span className={styles.emoji}>{m.emoji}</span>
          </div>
          <div className={styles.description}>{m.description}</div>
        </div>
      ))}
    </div>
  )
}

import styles from './CareerTimeline.module.css'
import type { TimelineEvent } from '../types'

interface Props {
  events: TimelineEvent[]
}

export default function CareerTimeline({ events }: Props) {
  return (
    <div className={styles.container}>
      {events.map((entry, i) => (
        <div key={i} className={styles.entry}>
          <div className={styles.year}>{entry.year}</div>
          <div className={styles.dotLine}>
            <div className={styles.dot} />
            {i < events.length - 1 && <div className={styles.line} />}
          </div>
          <div className={styles.event}>{entry.event}</div>
        </div>
      ))}
    </div>
  )
}

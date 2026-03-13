import { useState, useEffect } from 'react'
import styles from './LoadingTrivia.module.css'
import { trivia } from '../data/trivia'

export default function LoadingTrivia() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * trivia.length)
  )
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex((prev) => {
          let next
          do {
            next = Math.floor(Math.random() * trivia.length)
          } while (next === prev)
          return next
        })
        setFade(true)
      }, 300)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.spinner}>⚽</div>
      <p className={styles.label}>מחפש את השחקן...</p>
      <p className={`${styles.trivia} ${fade ? styles.fadeIn : styles.fadeOut}`}>
        💡 {trivia[index]}
      </p>
    </div>
  )
}

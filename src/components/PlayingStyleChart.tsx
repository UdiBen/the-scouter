import styles from './PlayingStyleChart.module.css'
import type { PlayingStyle } from '../types'

const AXES = [
  { key: 'speed' as const, label: 'מהירות' },
  { key: 'dribbling' as const, label: 'כדרור' },
  { key: 'shooting' as const, label: 'בעיטה' },
  { key: 'passing' as const, label: 'מסירות' },
  { key: 'defense' as const, label: 'הגנה' },
  { key: 'physical' as const, label: 'פיזיות' },
]

const CX = 150
const CY = 150
const R = 120
const RINGS = 4

function polarToXY(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)]
}

function getVertices(radius: number): [number, number][] {
  return AXES.map((_, i) => polarToXY((360 / AXES.length) * i, radius))
}

interface Props {
  style: PlayingStyle
}

export default function PlayingStyleChart({ style }: Props) {
  const outerVertices = getVertices(R)

  const dataPoints = AXES.map((axis, i) => {
    const value = style[axis.key]
    const fraction = Math.min(value, 99) / 99
    return polarToXY((360 / AXES.length) * i, R * fraction)
  })

  const labelPositions = AXES.map((_, i) =>
    polarToXY((360 / AXES.length) * i, R + 22)
  )

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
        <svg viewBox="0 0 300 300" width="260" height="260" style={{ overflow: 'visible' }}>
          {Array.from({ length: RINGS }, (_, ring) => {
            const ringR = R * ((ring + 1) / RINGS)
            const verts = getVertices(ringR)
            return (
              <polygon
                key={ring}
                points={verts.map((v) => v.join(',')).join(' ')}
                fill="none"
                stroke={`rgba(34,211,238,${0.04 + ring * 0.02})`}
                strokeWidth="1"
              />
            )
          })}

          {outerVertices.map((v, i) => (
            <line key={i} x1={CX} y1={CY} x2={v[0]} y2={v[1]} stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
          ))}

          <polygon
            points={dataPoints.map((p) => p.join(',')).join(' ')}
            fill="rgba(34,211,238,0.2)"
            stroke="#22d3ee"
            strokeWidth="2"
          />

          {dataPoints.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#22d3ee" />
          ))}

          {AXES.map((axis, i) => {
            const [x, y] = labelPositions[i]
            const value = style[axis.key]
            return (
              <text
                key={axis.key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#67e8f9"
                fontSize="11"
                fontFamily="sans-serif"
              >
                {axis.label} {value}
              </text>
            )
          })}
        </svg>
      </div>

      <div className={styles.description}>{style.description}</div>
    </div>
  )
}

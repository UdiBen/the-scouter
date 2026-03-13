import { GoogleGenerativeAI } from '@google/generative-ai'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'src', 'data', 'players.json')

const LEAGUES = [
  { name: 'Premier League', nameHe: 'פרמייר ליג' },
  { name: 'La Liga', nameHe: 'לה ליגה' },
  { name: 'Ligue 1', nameHe: 'ליג 1' },
  { name: 'Serie A', nameHe: 'סריה א' },
  { name: 'Bundesliga', nameHe: 'בונדסליגה' },
  { name: 'Israeli Premier League', nameHe: 'ליגת העל הישראלית' },
]

const PROMPT = (league) => `
תן לי רשימה של 80-100 שחקני כדורגל בולטים ב-${league.name} (${league.nameHe}) לעונה הנוכחית.

החזר JSON בלבד, בלי טקסט נוסף, בפורמט הבא:
[
  { "name": "שם השחקן בעברית", "flag": "אמוג׳י דגל המדינה" }
]

חשוב:
- שמות בעברית בלבד
- כלול שחקנים מכל הקבוצות בליגה
- אמוג׳י דגל לאום השחקן (לא דגל הליגה)
`

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY environment variable')
    process.exit(1)
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const allPlayers = []
  const seen = new Set()

  for (const league of LEAGUES) {
    console.log(`Fetching ${league.name}...`)
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: PROMPT(league) }] }],
        tools: [{ googleSearchRetrieval: {} }],
      })
      const text = result.response.text()
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error(`Failed to parse ${league.name} response`)
        continue
      }
      const players = JSON.parse(jsonMatch[0])
      for (const player of players) {
        if (!seen.has(player.name)) {
          seen.add(player.name)
          allPlayers.push(player)
        }
      }
      console.log(`  Got ${players.length} players (${allPlayers.length} total unique)`)
    } catch (error) {
      console.error(`Error fetching ${league.name}:`, error.message)
    }
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(allPlayers, null, 2), 'utf-8')
  console.log(`\nDone! Wrote ${allPlayers.length} players to ${OUTPUT_PATH}`)
}

main()

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `אתה מומחה כדורגל. המשתמש יחפש שחקן כדורגל ואתה תחזיר מידע עליו בפורמט JSON בלבד.

החזר JSON בפורמט הבא בלבד, בלי טקסט נוסף:
{
  "found": true,
  "fullName": "שם מלא בעברית",
  "displayName": "השם המוכר של השחקן בעברית, בלי שמות משפחה נוספים (לדוגמה: קיליאן אמבפה, לא קיליאן אמבפה לוטן)",
  "nationality": "שם המדינה בעברית",
  "nationalityFlag": "אמוג׳י דגל",
  "age": מספר,
  "position": "עמדה קצרה בעברית (שוער/מגן/קשר/חלוץ)",
  "shirtNumber": מספר או null,
  "status": "פעיל" או "פרש ב-YYYY" (שנת פרישה),
  "currentClub": "שם הקבוצה הנוכחית בעברית",
  "englishName": "Full name in English",
  "imageUrl": "URL of a photo of the player from a reliable source (Wikipedia, official team site, etc.) or null if not found",
  "funFact": "עובדה מעניינת ומפתיעה על השחקן בעברית, מותאמת לילד בן 9",
  "personalLife": "מידע אישי מעניין - נשוי? ילדים? זוגיות מפורסמת? תחביבים מיוחדים? בעברית, מותאם לילד בן 9",
  "achievements": "הישגים עיקריים מופרדים ב-· בעברית",
  "career": [
    {
      "club": "שם קבוצה בעברית",
      "clubColor": "צבע הקבוצה בפורמט hex, לדוגמה #e63946",
      "years": "שנה-שנה",
      "appearances": מספר,
      "goals": מספר,
      "assists": מספר או null אם לא ידוע
    }
  ],
  "trophies": [
    {
      "name": "שם הגביע בעברית",
      "emoji": "אמוג׳י מתאים (🏆/⭐/🥇/👟)",
      "count": מספר,
      "category": "league" | "europe" | "international" | "individual"
    }
  ],
  "playingStyle": {
    "speed": מספר 0-99,
    "dribbling": מספר 0-99,
    "shooting": מספר 0-99,
    "passing": מספר 0-99,
    "defense": מספר 0-99,
    "physical": מספר 0-99,
    "description": "תיאור סגנון המשחק בעברית, מותאם לילד בן 9"
  },
  "timeline": [
    {
      "year": מספר,
      "event": "אירוע חשוב בקריירה בעברית, אפשר לכלול אמוג׳י"
    }
  ],
  "similarPlayers": [
    {
      "name": "שם בעברית",
      "englishName": "Name in English",
      "flag": "אמוג׳י דגל",
      "relation": "סיבת הדמיון בעברית (סגנון דומה/אותו עידן/אותה עמדה)"
    }
  ],
  "iconicMoments": [
    {
      "year": מספר,
      "match": "תיאור קצר של המשחק בעברית",
      "emoji": "אמוג׳י מתאים",
      "description": "תיאור מרגש של הרגע בעברית, מותאם לילד בן 9"
    }
  ]
}

כלול 3-5 רגעים איקוניים.
כלול 3 שחקנים דומים.
כלול 3-8 אירועים בציר הזמן, מהחשובים ביותר.
כלול את כל הגביעים המשמעותיים.
דירוגי סגנון המשחק צריכים להיות ריאליסטיים ולשקף את היכולות האמיתיות של השחקן.
כלול את כל הקבוצות שהשחקן שיחק בהן כולל נבחרת לאומית.
שורת הנבחרת הלאומית תהיה אחרונה ברשימה.
אם מספר הבישולים (assists) לא ידוע, החזר null.
אם השחקן לא נמצא החזר: {"found": false}
כל הטקסט חייב להיות בעברית מלבד englishName ו-clubColor.`

function extractJSON(text: string): Record<string, unknown> | null {
  // Strip markdown code fences if present
  const stripped = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '')

  // Find the outermost balanced JSON object
  const start = stripped.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"' && !escape) { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(stripped.slice(start, i + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query } = req.body
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing query' })
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: query }] }],
      tools: [{ googleSearch: {} } as never],
    })

    const text = result.response.text()
    const data = extractJSON(text)
    if (data) {
      return res.status(200).json(data)
    }

    // Retry once on bad JSON
    console.log('First attempt failed to parse, retrying. Raw:', text.slice(0, 200))
    const retry = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: query }] }],
      tools: [{ googleSearch: {} } as never],
    })
    const retryData = extractJSON(retry.response.text())
    if (retryData) {
      return res.status(200).json(retryData)
    }

    console.error('Both attempts failed to parse JSON')
    return res.status(500).json({ error: 'Invalid response format' })
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({ error: 'Search failed' })
  }
}

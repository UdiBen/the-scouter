import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `אתה מומחה כדורגל. המשתמש יחפש שחקן כדורגל ואתה תחזיר מידע עליו בפורמט JSON בלבד.

החזר JSON בפורמט הבא בלבד, בלי טקסט נוסף:
{
  "found": true,
  "fullName": "שם מלא בעברית",
  "nationality": "שם המדינה בעברית",
  "nationalityFlag": "אמוג׳י דגל",
  "age": מספר,
  "position": "עמדה בעברית (שוער/מגן/קשר/חלוץ)",
  "shirtNumber": מספר או null,
  "currentClub": "שם הקבוצה הנוכחית בעברית",
  "englishName": "Full name in English",
  "funFact": "עובדה מעניינת ומפתיעה על השחקן בעברית, מותאמת לילד בן 9",
  "achievements": "הישגים עיקריים מופרדים ב-· בעברית",
  "career": [
    {
      "club": "שם קבוצה בעברית",
      "clubEmoji": "אמוג׳י צבע הקבוצה",
      "years": "שנה-שנה",
      "appearances": מספר,
      "goals": מספר,
      "assists": מספר
    }
  ]
}

כלול את כל הקבוצות שהשחקן שיחק בהן כולל נבחרת לאומית.
שורת הנבחרת הלאומית תהיה אחרונה ברשימה.
אם השחקן לא נמצא החזר: {"found": false}
כל הטקסט חייב להיות בעברית מלבד englishName.`

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
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Retry once on bad JSON
      const retry = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{ googleSearch: {} } as never],
      })
      const retryText = retry.response.text()
      const retryMatch = retryText.match(/\{[\s\S]*\}/)
      if (!retryMatch) {
        return res.status(500).json({ error: 'Invalid response format' })
      }
      return res.status(200).json(JSON.parse(retryMatch[0]))
    }

    const data = JSON.parse(jsonMatch[0])
    return res.status(200).json(data)
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({ error: 'Search failed' })
  }
}

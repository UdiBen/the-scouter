import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const q = req.query.q
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ url: null })
  }

  try {
    const encoded = encodeURIComponent(q)

    // Try English Wikipedia first
    const enRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`
    )
    if (enRes.ok) {
      const enData = await enRes.json()
      if (enData.thumbnail?.source) {
        return res.status(200).json({ url: enData.thumbnail.source })
      }
    }

    // Fallback: Hebrew Wikipedia
    const heRes = await fetch(
      `https://he.wikipedia.org/api/rest_v1/page/summary/${encoded}`
    )
    if (heRes.ok) {
      const heData = await heRes.json()
      if (heData.thumbnail?.source) {
        return res.status(200).json({ url: heData.thumbnail.source })
      }
    }

    return res.status(200).json({ url: null })
  } catch (error) {
    console.error('Image search error:', error)
    return res.status(200).json({ url: null })
  }
}

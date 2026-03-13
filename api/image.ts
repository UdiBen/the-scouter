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
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`
    )

    if (!response.ok) {
      return res.status(200).json({ url: null })
    }

    const data = await response.json()
    const url = data.thumbnail?.source ?? null
    return res.status(200).json({ url })
  } catch (error) {
    console.error('Image search error:', error)
    return res.status(200).json({ url: null })
  }
}

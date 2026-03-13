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
    const params = new URLSearchParams({
      key: process.env.GOOGLE_CSE_API_KEY!,
      cx: process.env.GOOGLE_CSE_ID!,
      q: `${q} soccer player photo`,
      searchType: 'image',
      num: '1',
    })

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`
    )

    if (!response.ok) {
      return res.status(200).json({ url: null })
    }

    const data = await response.json()
    const url = data.items?.[0]?.link ?? null
    return res.status(200).json({ url })
  } catch (error) {
    console.error('Image search error:', error)
    return res.status(200).json({ url: null })
  }
}

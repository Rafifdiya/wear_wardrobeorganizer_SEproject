import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const VALID_COLORS = ['white', 'black', 'gray', 'navy', 'blue', 'red', 'pink', 'green', 'yellow', 'orange', 'purple', 'brown', 'beige', 'olive', 'denim', 'multicolor']
const VALID_CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'footwear', 'accessory']

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured.' }, { status: 503 })

  const { imageBase64, mimeType } = await req.json()
  if (!imageBase64 || !mimeType) return NextResponse.json({ error: 'Missing image data.' }, { status: 400 })

  const prompt = `Analyze this clothing item image and respond with ONLY a JSON object (no markdown, no explanation) with exactly two fields:
- "color": the dominant color of the clothing. Must be one of: white, black, gray, navy, blue, red, pink, green, yellow, orange, purple, brown, beige, olive, denim, multicolor
- "category": the type of clothing. Must be one of: top, bottom, dress, outerwear, footwear, accessory

Rules:
- "top" = shirts, t-shirts, blouses, sweaters, hoodies, tank tops
- "bottom" = pants, jeans, skirts, shorts
- "dress" = dresses, jumpsuits, rompers
- "outerwear" = jackets, coats, blazers, vests
- "footwear" = shoes, sneakers, boots, sandals, heels
- "accessory" = bags, hats, belts, scarves, jewelry

Example response: {"color":"blue","category":"top"}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  )

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    console.error('[analyze] Gemini error', res.status, JSON.stringify(errBody))
    return NextResponse.json({ error: 'Failed to analyze image.' }, { status: res.status })
  }

  const data = await res.json()
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const parsed = JSON.parse(text)
    const color = VALID_COLORS.includes(parsed.color) ? parsed.color : null
    const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : null
    return NextResponse.json({ color, category })
  } catch {
    return NextResponse.json({ error: 'Failed to parse analysis result.' }, { status: 500 })
  }
}

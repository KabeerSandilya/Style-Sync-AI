import { GoogleGenAI } from '@google/genai'

export interface WardrobeComposition {
  categoryCounts: Record<string, number>
  topStyles: string[]
  seasonBreakdown: Record<string, number>
  preferredOccasions: string[]
}

export interface GapAnalysisResult {
  gaps: Array<{ category: string; reason: string }>
  capsuleScore: number // 0–100
}

const SYSTEM_PROMPT = `You are a wardrobe consultant. Given a structured
summary of a user's wardrobe composition, identify concrete gaps — garment
categories that are missing or underrepresented relative to their preferred
occasions and seasons. Reference only the data provided; do not invent
categories that make no sense for the occasions listed. Never recommend
specific brands or products.`

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.')
  }
  return new GoogleGenAI({ apiKey })
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  return raw.trim()
}

export async function analyzeWardrobeGaps(
  composition: WardrobeComposition
): Promise<GapAnalysisResult> {
  const ai = getGenAIClient()

  const prompt = `${SYSTEM_PROMPT}

Wardrobe composition (JSON):
${JSON.stringify(composition, null, 2)}

Return ONLY a valid JSON object with this exact structure:
{
  "gaps": [
    { "category": "short category name", "reason": "one sentence explaining the gap relative to the data above" }
  ],
  "capsuleScore": 0
}

Provide 2–5 gaps. capsuleScore is 0–100, rating how complete this wardrobe is for the occasions listed.`

  let response
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.6 },
    })
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 503) {
      console.warn('[analyzeWardrobeGaps] gemini-2.5-flash unavailable (503), retrying with gemini-2.0-flash')
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.6 },
      })
    } else {
      throw err
    }
  }

  const raw = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const jsonText = extractJson(raw)

  let parsed: GapAnalysisResult
  try {
    parsed = JSON.parse(jsonText) as GapAnalysisResult
  } catch {
    throw new Error('Gemini returned malformed JSON for gap analysis.')
  }

  if (
    !Array.isArray(parsed.gaps) ||
    typeof parsed.capsuleScore !== 'number'
  ) {
    throw new Error('Gemini returned an invalid gap analysis structure')
  }

  parsed.capsuleScore = Math.max(0, Math.min(100, Math.round(parsed.capsuleScore)))
  parsed.gaps = parsed.gaps.slice(0, 5)

  return parsed
}

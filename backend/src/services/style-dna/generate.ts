import { GoogleGenAI } from '@google/genai'
import { WardrobeSummary } from './summarize'

export interface StyleDNAResult {
  archetype: string
  colorStory: { colors: string[]; narrative: string }
  signaturePieces: string[]
  styleKeywords: string[]
  styleNarrative: string
  wardrobeStrengths: string[]
  blindSpots: string[]
}

const SYSTEM_PROMPT = `You are a senior fashion editor at an editorial magazine.
Given a structured summary of a user's wardrobe and outfit history, generate a
concise, insightful Style DNA profile. Write in a confident editorial voice —
never robotic, never generic. Reference only the data provided; do not invent
garments or colors not present in the summary.`

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

export async function generateStyleDNA(
  summary: WardrobeSummary,
  garmentIds: string[],
): Promise<StyleDNAResult> {
  const ai = getGenAIClient()

  const prompt = `${SYSTEM_PROMPT}

Wardrobe summary (JSON):
${JSON.stringify(summary, null, 2)}

Available garment IDs for signaturePieces selection:
${garmentIds.join(', ')}

Return ONLY a valid JSON object with this exact structure:
{
  "archetype": "2–4 word style label",
  "colorStory": {
    "colors": ["color1", "color2", "color3"],
    "narrative": "One sentence describing the color palette mood"
  },
  "signaturePieces": ["garmentId1", "garmentId2"],
  "styleKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "styleNarrative": "2–3 sentence editorial description of this person's style identity.",
  "wardrobeStrengths": ["strength1", "strength2", "strength3"],
  "blindSpots": ["gap1", "gap2"]
}`

  let response
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    })
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 503) {
      console.warn('[generateStyleDNA] gemini-2.5-flash unavailable (503), retrying with gemini-2.0-flash')
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      })
    } else {
      throw err
    }
  }

  const raw = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const jsonText = extractJson(raw)

  let parsed: StyleDNAResult
  try {
    parsed = JSON.parse(jsonText) as StyleDNAResult
  } catch {
    throw new Error('Gemini returned malformed JSON for Style DNA.')
  }

  if (
    typeof parsed.archetype !== 'string' ||
    !Array.isArray(parsed.colorStory?.colors) ||
    typeof parsed.colorStory?.narrative !== 'string' ||
    !Array.isArray(parsed.signaturePieces) ||
    !Array.isArray(parsed.styleKeywords) ||
    typeof parsed.styleNarrative !== 'string' ||
    !Array.isArray(parsed.wardrobeStrengths) ||
    !Array.isArray(parsed.blindSpots)
  ) {
    throw new Error('Gemini returned an invalid Style DNA structure')
  }

  // Constrain signaturePieces to actual garment IDs
  const validIds = new Set(garmentIds)
  parsed.signaturePieces = parsed.signaturePieces.filter(id => validIds.has(id)).slice(0, 3)

  return parsed
}

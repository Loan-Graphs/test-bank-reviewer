import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// POST /api/evaluate
// Called to evaluate a single question via Claude
// In production, call this from a background worker or cron job
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json()
  const { question, correctAnswer, subject, subjectMemory } = body

  if (!question || !correctAnswer) {
    return NextResponse.json({ error: 'Missing question or correctAnswer' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  // Build memory context from past mistakes
  const memoryContext = subjectMemory && subjectMemory.length > 0
    ? `\n\nIMPORTANT — Past mistakes in this subject to watch out for:\n${subjectMemory.map((m: { mistakePattern: string; resolution: string }) => `- ${m.mistakePattern}: ${m.resolution}`).join('\n')}`
    : ''

  const prompt = `You are evaluating a mortgage industry test bank question for accuracy and clarity.

Subject: ${subject}

Question: ${question}

Provided Answer: ${correctAnswer}
${memoryContext}

Evaluate whether the answer is:
1. Factually correct for the mortgage/lending industry
2. Clearly written and unambiguous
3. Appropriate for a licensing or training exam

Respond with a JSON object:
{
  "verdict": "correct" | "incorrect" | "needs_review",
  "confidence": <number 0-100>,
  "explanation": "<brief explanation of your verdict>"
}

Be strict about factual accuracy. If the answer is technically correct but could be clearer, use "needs_review".`

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      verdict: result.verdict,
      confidence: result.confidence,
      explanation: result.explanation,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

---
name: human
description: Rewrite or draft text so it reads like a human wrote it, stripping out known AI-writing tells (per Wikipedia's "Signs of AI writing" essay). Trigger this whenever the user types "/human" as a command, alone or followed by text. If followed by text, apply the rules to that text. If alone, apply the rules to the most recent draft/output in the conversation, or ask what to rewrite if nothing is available.
---

# Human

Rewrite text to remove AI writing tells. Apply ALL rules below, every time this skill triggers. No exceptions, no "just this once."

## Trigger

- `/human` + text → rewrite that text
- `/human` alone → rewrite the last thing Claude wrote in this conversation
- `/human` with no prior draft to point to → ask what to rewrite

## Hard bans (never do these)

**Words:** delve, intricate, tapestry, pivotal, underscore, landscape (metaphorical), foster, testament, enhance, crucial, boasts, "rich cultural heritage," "stands as," "plays a vital role"

**Phrases:**
- "It's important to note that..."
- "It's worth noting that..."
- "No discussion would be complete without..."
- "One of the most important things to consider is..."
- Any sentence that exists only to restate a point already made in the prior paragraph

**Sentence patterns:**
- "It's not just X, it's Y"
- Any negative-parallelism contrast built for drama rather than genuine contrast
- Tacking a vague meaning-clause onto a plain fact ("...highlighting its lasting impact," "...marking a significant milestone," "...underscoring its importance") — state the fact, stop there

**Structure:**
- Bulleted lists where a bolded lead phrase just gets repeated in the sentence after it
- Uniform sentence length across a whole paragraph — vary it
- Bolding terms for emphasis that doesn't need emphasis
- Overused transition words (moreover, furthermore, additionally) used reflexively instead of because the logic requires them
- Em dashes standing in for commas, colons, or parentheses — use the punctuation a human would actually pick
- Restating the same idea 2-3 times in different words for "flow"

**Tone:**
- Promotional/brochure language for neutral topics
- Inserting a verdict or interpretation the user didn't ask for
- Smoothing specific facts into vague generalities that could apply to anything

## What to do instead

- Say the thing once, plainly, then stop
- Let specific facts stay specific — don't round them off into platitudes
- Vary sentence length on purpose — short sentence after a long one, deliberately
- If a claim needs support, give the actual reason, not a formula
- Cut any sentence that only restates a previous sentence
- If bullets are genuinely the clearest format, use them, but don't repeat the bold lead-in text in the following sentence

## Combine with existing style preferences

The user also has standing preferences for direct, analytical, jargon-free writing in plain bullet points. When rewriting, keep that voice — this skill governs the AI-tell layer on top of it, not a replacement for it.

## Output

Return only the rewritten text, unless the user asks for a diff or explanation of changes.

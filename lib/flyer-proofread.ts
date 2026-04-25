export const FLYER_SYSTEM_PROMPT = `You are an expert copyeditor and marketing specialist for promotional flyers.

Your mission: read the flyer image carefully, improve the writing, and keep the final response clear and practical.

## What to do

### 1) 📋 Extract the original text
- Transcribe all visible text exactly as it appears.
- Preserve structure and hierarchy where possible (Headlines, Subheadings, Body Text, Contact Info, etc.).

### 2) ✍️ Correct language issues
- Fix spelling, grammar, punctuation, and typo errors.
- Keep the intended meaning and tone intact.

### 3) 🚀 Improve marketing impact
- Suggest concrete improvements for clarity, stronger CTA, and better audience engagement.
- Keep suggestions actionable and concise.

## Output format (Markdown only)

### 1. Original Extracted Text
[Insert extracted text]

### 2. Corrected Text
[Insert corrected version]

### 3. Editorial & Marketing Suggestions
- [Suggestion 1]
- [Suggestion 2]

### 4. Final Conclusion
- Errors Found: [Yes/No]
- If Yes: list the key corrected errors in short bullet points.
- If No: write exactly: "No significant spelling, grammar, punctuation, or typo errors were found."`;

export const OPENAI_MODELS = ["gpt-4o"] as const;
export const GEMINI_MODELS = ["gemini-1.5-pro", "gemini-1.5-flash"] as const;

export type ProofreadProvider = "openai" | "gemini";

export function isValidApiKey(provider: ProofreadProvider, key: string) {
  if (provider === "openai") {
    return /^sk-[A-Za-z0-9_-]{20,}$/.test(key);
  }

  return /^AIza[0-9A-Za-z_-]{20,}$/.test(key);
}

export function estimateTextTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function calculateOpenAIImageTokens(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 0;
  }

  const shortest = Math.min(width, height);
  const shortestScale = 768 / shortest;

  let scaledWidth = Math.round(width * shortestScale);
  let scaledHeight = Math.round(height * shortestScale);

  const longest = Math.max(scaledWidth, scaledHeight);
  if (longest > 2048) {
    const longestScale = 2048 / longest;
    scaledWidth = Math.round(scaledWidth * longestScale);
    scaledHeight = Math.round(scaledHeight * longestScale);
  }

  const tilesAcross = Math.ceil(scaledWidth / 512);
  const tilesDown = Math.ceil(scaledHeight / 512);
  const numberOfTiles = tilesAcross * tilesDown;

  return 85 + 170 * numberOfTiles;
}

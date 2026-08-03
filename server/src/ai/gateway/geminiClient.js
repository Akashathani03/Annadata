import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

// The only file in the backend that imports the Gemini SDK or touches
// env.geminiApiKey - this is the concrete enforcement of "isolated so
// AI providers can be changed in the future without affecting the
// overall architecture" (AI Gateway session). A future OpenAI/Claude/
// local-model client would be a sibling file implementing the same
// shape (model name + prompts in, text out), never a change to this
// file or to index.js's orchestration logic beyond picking which
// client to call.
const client = new GoogleGenAI({ apiKey: env.geminiApiKey });

// Purely mechanical - no task-type knowledge, no business logic. The
// model name is already resolved by the caller (modelRouter, via
// index.js); this function only knows how to actually make the call.
//
// responseSchema is optional and additive (Step 12) - when omitted,
// this produces byte-identical behavior to Step 11's original
// function (verified directly, not just assumed). When provided, it's
// passed straight through to Gemini's own structured-output
// constraint (config.responseSchema + responseMimeType) - the JSON
// itself is still independently validated by the caller afterward,
// never trusted on Gemini's constraint alone.
export async function callGemini({ modelName, systemPrompt, userPrompt, imageBase64, imageMimeType, responseSchema }) {
  const parts = [{ text: userPrompt }];
  if (imageBase64) {
    parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType || 'image/jpeg' } });
  }

  const config = {};
  if (systemPrompt) config.systemInstruction = systemPrompt;
  if (responseSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = responseSchema;
  }

  const response = await client.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts }],
    config: Object.keys(config).length > 0 ? config : undefined,
  });

  return response.text;
}

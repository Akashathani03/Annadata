import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { retryWithBackoff, isTransientError } from './retryWithBackoff.js';

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
//
// Resilience (added without changing this function's required
// params): the primary model is retried with exponential backoff on
// transient errors (429/500/502/503/504). If retries are exhausted
// and a fallbackModelName was given, one more attempt is made against
// that model, logged clearly, for this request only - the caller's
// own resolved modelName (and modelRouter.js's own permanent mapping)
// is never altered by this fallback.
export async function callGemini({ modelName, systemPrompt, userPrompt, imageBase64, imageMimeType, responseSchema, fallbackModelName }) {
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

  async function makeRequest(model) {
    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
      config: Object.keys(config).length > 0 ? config : undefined,
    });
    return response.text;
  }

  try {
    return await retryWithBackoff(() => makeRequest(modelName));
  } catch (err) {
    if (fallbackModelName && fallbackModelName !== modelName && isTransientError(err)) {
      logger.warn(
        { primaryModel: modelName, fallbackModel: fallbackModelName, reason: err.message },
        'Gemini request failed after retries - falling back to the configured fallback model for this request only'
      );
      return retryWithBackoff(() => makeRequest(fallbackModelName));
    }
    throw err;
  }
}

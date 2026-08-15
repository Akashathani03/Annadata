import { getModelForTask } from './modelRouter.js';
import { callGemini } from './geminiClient.js';

// Resilience fallback (added without touching modelRouter.js's own
// permanent mapping): which task type's model to fall back to, for a
// single request only, after the primary model's retries are
// exhausted on a transient error. Configurable in one place, not
// scattered inline across every exported function below - change this
// one constant to fall back to a different tier if ever needed.
const FALLBACK_TASK_TYPE = 'generation';

// The Gateway's entire external interface, per the locked design:
// "{task type} in -> generated content out", provider-agnostic by
// construction. Nothing outside src/ai/gateway/ ever references a
// literal model name or the Gemini SDK - only this one function.
//
// Deliberately minimal for Step 11's actual scope: no tools bound (Tool
// Registry is a separate later step), no structured-output schema
// (also later), no conversation history (the Gateway is stateless by
// design - a caller passes whatever context it wants as part of
// userPrompt, this function has no memory of its own). Extending this
// later - RAG context, a tools array, a second provider selected per
// task - is additive to this function's parameters, not a rework of
// its shape or of anything that already calls it.
//
// Throws on failure rather than swallowing errors - deciding how to
// handle a Gemini outage (retry, fail the request, fall back) belongs
// to whatever calls this later, not to the Gateway itself.
export async function generateCompletion({ taskType, systemPrompt, userPrompt, imageBase64, imageMimeType }) {
  const modelName = getModelForTask(taskType);
  const fallbackModelName = getModelForTask(FALLBACK_TASK_TYPE);
  const text = await callGemini({ modelName, systemPrompt, userPrompt, imageBase64, imageMimeType, fallbackModelName });
  return { text, model: modelName };
}

// Step 12: structured, validated generation - a distinct function
// alongside generateCompletion (left untouched above), not a
// replacement for it. Callers that only need free-form text still use
// generateCompletion; this one is for response types that need a
// stable, validated shape (diagnosis, general guidance).
//
// Unlike generateCompletion, this never lets a validation failure
// throw - it always resolves to a well-formed object matching
// responseType's schema, either the real validated response or a safe
// fallback (Step 12's explicit requirement: malformed AI output must
// never reach the frontend). Genuine infrastructure failures (Gemini
// unreachable, bad API key) still throw, same as generateCompletion -
// that's a different failure class from "the AI responded but the
// JSON was incomplete."
//
// schema/validate/buildFallback are injected by the caller rather
// than looked up here by responseType name - keeps this function
// itself free of any per-response-type knowledge, so adding a new
// response type later (Step 12 explicitly excludes this now, but the
// shape supports it) never means editing this file.
export async function generateStructuredCompletion({
  taskType,
  systemPrompt,
  userPrompt,
  imageBase64,
  imageMimeType,
  responseSchema,
  validate,
  buildFallback,
}) {
  const modelName = getModelForTask(taskType);
  const fallbackModelName = getModelForTask(FALLBACK_TASK_TYPE);
  const rawText = await callGemini({
    modelName,
    systemPrompt,
    userPrompt,
    imageBase64,
    imageMimeType,
    responseSchema,
    fallbackModelName,
  });

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { valid: false, data: buildFallback(), model: modelName, errors: ['Response was not valid JSON.'] };
  }

  const { valid, errors } = validate(parsed);
  if (!valid) {
    return { valid: false, data: buildFallback(), model: modelName, errors };
  }

  return { valid: true, data: parsed, model: modelName, errors: [] };
}

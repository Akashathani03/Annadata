// Pure lookup, no Gemini SDK import here at all - this file only
// knows task-type names and model-name strings, nothing about how a
// model actually gets called. That separation is what the AI Gateway
// session's design called for: a provider swap or a future multi-
// provider setup only ever touches geminiClient.js (or a sibling
// client file added later), never this mapping.
//
// Two tiers, matching the two task types Step 11 actually needs:
//   classification - cheap, fast, high-volume (used once the Intent
//     Router exists in a later step; nothing calls this tier yet)
//   generation - capable, multimodal (diagnosis/general guidance,
//     used once real AI responses replace Agro AI's mock ones)
//
// Model names are current as of implementation time (Aug 2026) -
// Gemini 1.5/2.0 are already fully shut down, and 2.5 is scheduled
// for shutdown in October 2026, so both were ruled out deliberately,
// not just habitually skipped. This is exactly the kind of value that
// should live in exactly one place: updating a model name later is a
// one-line change here, never a change to any caller.
const MODEL_BY_TASK_TYPE = {
  classification: 'gemini-3.5-flash-lite',
  generation: 'gemini-3.6-flash',
};

const DEFAULT_TASK_TYPE = 'generation';

export function getModelForTask(taskType) {
  return MODEL_BY_TASK_TYPE[taskType] || MODEL_BY_TASK_TYPE[DEFAULT_TASK_TYPE];
}

import { generateStructuredCompletion } from '../../../ai/gateway/index.js';
import { executeTool } from '../../../ai/toolRegistry/index.js';
import {
  ROUTING_RESPONSE_SCHEMA,
  buildToolsDescription,
  validateRoutingResponse,
  buildRoutingFallback,
} from './routingSchema.js';

const SYSTEM_PROMPT_TEMPLATE = `You are the routing layer for an agriculture assistant used by Indian farmers. For every message, decide exactly one intent:

- lookup: the farmer wants a real, current fact this app can retrieve - a price, the weather, a nearby shop, a government scheme. If lookup, set targetTool to the exact name of the tool that can answer it, and fill toolArgs with only the fields relevant to that tool, extracted from the farmer's message.
- generate: the farmer wants advice or an explanation that requires reasoning, not a stored fact - e.g. a crop problem to diagnose (generationType: "diagnosis") or general farming guidance (generationType: "general_guidance").
- navigate: the farmer wants to go to a specific part of the app (e.g. "take me to sell crops"). Set destination to a short identifier for where they want to go.
- out_of_scope: the message is a greeting, small talk, or unrelated to farming/this app entirely.

Available tools:
{{TOOLS_DESCRIPTION}}

Always set confidence (low/medium/high) honestly - if you're not sure which bucket fits, prefer out_of_scope over guessing.`;

function buildSystemPrompt(conversationSummary) {
  let prompt = SYSTEM_PROMPT_TEMPLATE.replace('{{TOOLS_DESCRIPTION}}', buildToolsDescription());
  if (conversationSummary) {
    prompt += `\n\n${conversationSummary}\n\nUse this recent conversation to resolve references like "there", "it", "that", or follow-up requests like "summarize", "explain simply", "give it in Kannada", or "continue" - these refer to what was just discussed above, not a new standalone topic. Do not use it for anything the farmer didn't actually ask about.`;
  }
  return prompt;
}

// FUTURE ROADMAP NOTE (not a Step 15 requirement, do not implement
// yet): "follow-up conversational transformations" - messages like
// "give it in Kannada", "explain simply", "summarize", "translate", or
// "short answer" that only make sense in reference to the assistant's
// previous reply. Also covers pronoun/reference follow-ups without a
// restated subject - e.g. "what's the price there" or "what about
// that market" after a market was just discussed (confirmed via real
// testing: with no crop and no market named in the message itself,
// this currently falls through to the "just answer about the nearest
// APMC" case rather than resolving "there" against the prior turn).
// These currently and correctly classify as out_of_scope or fall back
// to a context-free answer, since routeMessage has no memory of prior
// turns (each message is classified independently, per every AI
// step's standing exclusion of conversation memory). This is expected
// today, not a bug - but it should NOT be treated as a permanent
// out_of_scope/fallback category once conversation context exists in
// a later roadmap step. At that point, this router (or a layer above
// it) should recognize a transformation or reference request against
// the previous turn rather than routing it through the tool/
// generation pipeline as if it were a new, standalone question.

// The single decision-maker for routing messages, per the approved
// architecture. One structured-output call decides everything at
// once (intent, tool, tool args, destination, generation type,
// confidence) - the Tool Registry is only ever told what to execute,
// never asked to decide whether execution is needed.
//
// Only lookup intent is actually executed here (fetching real data
// through the Tool Registry) - generate/navigate/out_of_scope are
// classified and returned as-is, per Step 14's explicit scope. Acting
// on them (real generation, real navigation) is deliberately left to
// later steps.
export async function routeMessage({ userPrompt, imageBase64, imageMimeType, context, conversationSummary } = {}) {
  const { data: decision, valid } = await generateStructuredCompletion({
    taskType: 'classification',
    systemPrompt: buildSystemPrompt(conversationSummary),
    userPrompt,
    imageBase64,
    imageMimeType,
    responseSchema: ROUTING_RESPONSE_SCHEMA,
    validate: validateRoutingResponse,
    buildFallback: buildRoutingFallback,
  });

  if (!valid) {
    return decision; // already a safe, well-formed out_of_scope fallback
  }

  if (decision.intent === 'lookup') {
    const toolResult = await executeTool(decision.targetTool, decision.toolArgs, context || {});
    return { ...decision, toolResult };
  }

  return decision;
}

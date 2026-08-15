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
- diagnosis: the farmer is describing crop symptoms, asking what disease or problem their crop has, or has attached a photo of a crop issue for identification. Only use this when there is an actual symptom described or an image to analyze - not for follow-up questions about a diagnosis already given.
- conversation: everything else that's a natural exchange - greetings, thanks, acknowledgements ("okay", "I understood"), follow-up questions, requests to explain again/simplify/translate/summarize/continue a previous answer, general farming questions, or small talk. This is the default for normal conversation. Examples: "Hi", "Thank you", "Tomorrow I'll upload the photo", "Explain simply", "Explain in Kannada", "Summarize", "What do you mean?", "Which medicine?", "Will this work?".
- navigate: the farmer wants to go to a specific part of the app (e.g. "take me to sell crops"). Set destination to a short identifier for where they want to go.
- out_of_scope: reserve this only for messages genuinely unrelated to farming or this app - not for greetings or normal conversation, which belong to conversation instead.

Available tools:
{{TOOLS_DESCRIPTION}}

Always set confidence (low/medium/high) honestly - if you're not sure which bucket fits, prefer conversation over guessing, since a natural reply is safer than a wrong tool call or a fabricated diagnosis.`;

function buildSystemPrompt(conversationSummary) {
  let prompt = SYSTEM_PROMPT_TEMPLATE.replace('{{TOOLS_DESCRIPTION}}', buildToolsDescription());
  if (conversationSummary) {
    prompt += `\n\n${conversationSummary}\n\nUse this recent conversation to resolve references like "there", "it", "that" when extracting lookup arguments, and to tell a genuinely new diagnosis request apart from a follow-up question about a diagnosis already given (the latter is conversation, not diagnosis again). Do not use it for anything the farmer didn't actually ask about.`;
  }
  return prompt;
}

// RESOLVED (was a future roadmap note through Steps 15-16): "follow-up
// conversational transformations" - messages like "give it in
// Kannada", "explain simply", "summarize", pronoun/reference
// follow-ups ("what's the price there"), acknowledgements, and
// greetings are now handled by the conversation intent above, not
// treated as out_of_scope or forced through the diagnosis/lookup
// pipeline. The conversation intent's own generation prompt (in
// conversation.service.js) is deliberately simple and unenumerated -
// no "if greeting/if thanks/if summary" rules, the model reasons
// naturally using the same recent-conversation context this router
// already builds.

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

import { getToolDefinitions } from '../../../ai/toolRegistry/index.js';
import { VALID_DESTINATIONS } from './destinations.js';

// Single structured-output schema covering every routing decision in
// one pass, per the approved architecture: the Intent Router is the
// one decision-maker, not the Tool Registry (which only executes) and
// not the Gateway (which only talks to the model). toolArgs is a flat
// bag of every possible argument across all 4 tools - Gemini's
// structured output doesn't support a field whose shape depends on
// another field's value, so this stays simple rather than trying to
// force polymorphism the schema format can't express. Which fields
// actually apply is determined by targetTool, not by the schema shape.
export const ROUTING_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    intent: { type: 'STRING', enum: ['lookup', 'generate', 'navigate', 'out_of_scope'] },
    targetTool: { type: 'STRING', description: 'The exact tool name to call, if intent is lookup. Empty string otherwise.' },
    toolArgs: {
      type: 'OBJECT',
      description: 'Arguments for the target tool, if intent is lookup. Only include fields relevant to that specific tool.',
      properties: {
        cropName: { type: 'STRING', description: 'For market_price_lookup.' },
        productQuery: { type: 'STRING', description: 'For nearby_shops_lookup.' },
        query: { type: 'STRING', description: 'For government_scheme_lookup.' },
      },
    },
    destination: { type: 'STRING', description: `If intent is navigate, one of: ${VALID_DESTINATIONS.join(', ')}. Empty string otherwise.` },
    generationType: { type: 'STRING', description: 'Which kind of response is needed, if intent is generate: "diagnosis" or "general_guidance". Empty string otherwise.' },
    confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
  },
  required: ['intent', 'confidence'],
};

// Dynamically builds tool knowledge for the prompt from the Tool
// Registry's own definitions - the single source of truth, never
// duplicated as hardcoded tool descriptions here.
export function buildToolsDescription() {
  return getToolDefinitions()
    .map((t) => `- ${t.name}: ${t.description}`)
    .join('\n');
}

const VALID_INTENTS = ['lookup', 'generate', 'navigate', 'out_of_scope'];
const VALID_GENERATION_TYPES = ['diagnosis', 'general_guidance', ''];
const VALID_CONFIDENCE = ['low', 'medium', 'high'];

// Independent of Gemini's own schema constraint, same two-layer
// defense established in Step 12. Cross-checks targetTool against the
// Tool Registry's real registered names, not a hardcoded list, so
// this stays correct if tools are ever added or removed.
export function validateRoutingResponse(raw) {
  const errors = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Response is not a JSON object.'] };
  }

  if (typeof raw.intent !== 'string' || !VALID_INTENTS.includes(raw.intent)) {
    errors.push(`Field intent must be one of ${VALID_INTENTS.join(', ')}, got "${raw.intent}"`);
  }

  if (typeof raw.confidence !== 'string' || !VALID_CONFIDENCE.includes(raw.confidence)) {
    errors.push(`Field confidence must be one of ${VALID_CONFIDENCE.join(', ')}, got "${raw.confidence}"`);
  }

  if (raw.intent === 'lookup') {
    const knownToolNames = getToolDefinitions().map((t) => t.name);
    if (typeof raw.targetTool !== 'string' || !knownToolNames.includes(raw.targetTool)) {
      errors.push(`Field targetTool must be a registered tool name when intent is lookup, got "${raw.targetTool}"`);
    }
  }

  if (raw.intent === 'navigate') {
    if (typeof raw.destination !== 'string' || !VALID_DESTINATIONS.includes(raw.destination)) {
      errors.push(`Field destination must be one of ${VALID_DESTINATIONS.join(', ')} when intent is navigate, got "${raw.destination}"`);
    }
  }

  if (raw.intent === 'generate') {
    if (typeof raw.generationType !== 'string' || !VALID_GENERATION_TYPES.includes(raw.generationType) || raw.generationType === '') {
      errors.push(`Field generationType must be one of diagnosis, general_guidance when intent is generate, got "${raw.generationType}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// Misclassifying as out_of_scope (declining to help) is safer than
// guessing a wrong tool or generation path and risking a wrong or
// fabricated answer - same "prefer declining over guessing" principle
// already established for the domain tools themselves.
export function buildRoutingFallback() {
  return {
    intent: 'out_of_scope',
    targetTool: '',
    toolArgs: {},
    destination: '',
    generationType: '',
    confidence: 'low',
  };
}

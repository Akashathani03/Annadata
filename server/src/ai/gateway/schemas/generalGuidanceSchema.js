// Structured-output schema, validator, and safe fallback for general
// farming guidance responses - the plain-text assistant message shape
// already rendered by MessageBubble (no card, just text). Kept in its
// own file for the same reason diagnosisSchema.js is separate: future
// fields are additive to one file, never a shared one.

export const GENERAL_GUIDANCE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    responseText: { type: 'STRING', description: 'A short, clear, farmer-friendly answer.' },
  },
  required: ['responseText'],
};

export function validateGeneralGuidanceResponse(raw) {
  const errors = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Response is not a JSON object.'] };
  }

  const { responseText } = raw;
  if (responseText === undefined || responseText === null) {
    errors.push('Missing required field: responseText');
  } else if (typeof responseText !== 'string') {
    errors.push(`Field responseText must be a string, got ${typeof responseText}`);
  } else if (responseText.trim().length === 0) {
    errors.push('Field responseText must not be empty');
  }

  return { valid: errors.length === 0, errors };
}

export function buildGeneralGuidanceFallback() {
  return {
    responseText:
      "I'm not able to answer that clearly right now. Please try rephrasing your question, or consult a local agriculture expert.",
  };
}

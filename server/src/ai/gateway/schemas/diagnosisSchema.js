// Structured-output schema, validator, and safe fallback for crop
// diagnosis responses - the one response type DiagnosisCard.jsx
// already renders. Scoped to its own file so future fields
// (citations, disease identifiers, multilingual content, confidence
// explanations - explicitly not built now) are additive here without
// touching anything in ai/gateway/index.js.

// Gemini's own structured-output constraint (config.responseSchema) -
// an OpenAPI-subset schema, uppercase types. This is the FIRST line of
// defense: Gemini is constrained to only emit JSON matching this
// shape. The validator below is the second, independent line of
// defense - never trust a single layer for something a farmer will
// act on.
//
// disclaimer is deliberately NOT part of what the AI generates - it's
// fixed, compliance-relevant text, not something to let the model
// phrase freely. It gets attached after validation, in
// buildDiagnosisCardData below.
export const DIAGNOSIS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    problem: { type: 'STRING', description: 'The likely crop disease or issue, in plain language a farmer would recognize.' },
    severity: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
    suggestedAction: { type: 'STRING', description: 'What the farmer should do next.' },
    confidenceLevel: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    confidence: { type: 'STRING', description: "A short natural-language sentence describing how sure the diagnosis is, matching confidenceLevel (e.g. \"I'm quite sure, based on your photo.\")." },
    likelyCause: { type: 'STRING' },
    prevention: { type: 'STRING' },
  },
  required: ['problem', 'severity', 'suggestedAction', 'confidenceLevel', 'confidence', 'likelyCause', 'prevention'],
};

const SEVERITY_VALUES = ['Low', 'Medium', 'High'];
const CONFIDENCE_LEVEL_VALUES = ['low', 'medium', 'high'];
const REQUIRED_STRING_FIELDS = [
  'problem',
  'severity',
  'suggestedAction',
  'confidenceLevel',
  'confidence',
  'likelyCause',
  'prevention',
];

// Independent of Gemini's own schema constraint - even though Gemini
// is configured to only emit this shape, this function never assumes
// that constraint held. Checks required fields, correct types, enum
// membership, and empty/null values, exactly per Step 12's explicit
// validation list.
export function validateDiagnosisResponse(raw) {
  const errors = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Response is not a JSON object.'] };
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = raw[field];
    if (value === undefined || value === null) {
      errors.push(`Missing required field: ${field}`);
    } else if (typeof value !== 'string') {
      errors.push(`Field ${field} must be a string, got ${typeof value}`);
    } else if (value.trim().length === 0) {
      errors.push(`Field ${field} must not be empty`);
    }
  }

  if (typeof raw.severity === 'string' && !SEVERITY_VALUES.includes(raw.severity)) {
    errors.push(`Field severity must be one of ${SEVERITY_VALUES.join(', ')}, got "${raw.severity}"`);
  }

  if (typeof raw.confidenceLevel === 'string' && !CONFIDENCE_LEVEL_VALUES.includes(raw.confidenceLevel)) {
    errors.push(`Field confidenceLevel must be one of ${CONFIDENCE_LEVEL_VALUES.join(', ')}, got "${raw.confidenceLevel}"`);
  }

  return { valid: errors.length === 0, errors };
}

// Well-formed, safe, and honest about its own uncertainty - shown only
// when Gemini's response fails validation, never a fabricated
// diagnosis. Matches DiagnosisCard's exact prop shape, same as a real
// validated response would.
export function buildDiagnosisFallback() {
  return {
    problem: 'Unable to determine from this photo',
    severity: 'Low',
    suggestedAction: 'Please try again with a clearer photo, or consult a local agriculture expert.',
    confidenceLevel: 'low',
    confidence: "I couldn't confidently analyze this one - please consult a local expert.",
    likelyCause: 'Not determined',
    prevention: 'Consult a local agriculture expert for guidance specific to your crop.',
    disclaimer: 'AI diagnosis - confirm with a local expert.',
  };
}

// Attaches the fixed disclaimer to a validated response, producing the
// exact shape DiagnosisCard.jsx already expects as cardData - the
// frontend contract this whole step is built to preserve.
export function buildDiagnosisCardData(validated) {
  return { ...validated, disclaimer: 'AI diagnosis - confirm with a local expert.' };
}

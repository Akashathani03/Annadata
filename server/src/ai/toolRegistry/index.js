import { tools } from './tools.js';

// The Tool Registry's entire external interface. Metadata and
// execution are deliberately separate functions, per the "isolate
// tool metadata / isolate tool execution" requirement - a caller
// binding tools to a provider only ever needs getToolDefinitions();
// only the executor (the Gateway, once it has a decision back from
// Gemini) ever calls executeTool. No provider-specific logic here at
// all - this file has no idea Gemini exists.

// Strips the executor function out of what's exposed as metadata -
// a provider-binding caller has no business holding a reference to
// the actual implementation, only the name/description/parameters
// needed to describe the tool.
export function getToolDefinitions() {
  return tools.map(({ name, description, parameters }) => ({ name, description, parameters }));
}

// context carries session-level data (the farmer's location) that a
// tool's arguments never include, per tools.js's own design notes.
// Throws for a genuinely unknown tool name - Gemini should only ever
// request a name that was in the definitions it was given, so this
// path being hit at all indicates something worth surfacing loudly,
// not silently ignoring.
export async function executeTool(name, args, context = {}) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.execute(args || {}, context);
}

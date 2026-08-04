import * as governmentSchemeRepository from '../../../repositories/governmentScheme.repository.js';

function toSchemeShape(scheme) {
  return { ...scheme.toObject(), id: scheme._id };
}

// Whole-phrase match first - this is the exact behavior the frontend
// search box has always had (typing "irrigation" or "PM-KISAN" matches
// precisely as before, byte-for-byte). Only falls through to the
// token-based check below if the literal phrase isn't found, which is
// what happens with longer, AI-extracted queries (e.g. "irrigation
// subsidy drip sprinkler PMKSY") that are unlikely to ever appear as
// one exact substring even when every individual word genuinely is
// present in the scheme's real text.
//
// The fallback is still fully deterministic literal-substring matching
// per word - no typo tolerance, no semantic/embedding similarity, no
// probabilistic scoring. A minimum match count (not just "any one
// word") keeps it from matching on a single coincidental term.
function matchesQuery(scheme, query) {
  const haystack = `${scheme.title} ${scheme.description}`.toLowerCase();
  const q = query.trim().toLowerCase();

  if (haystack.includes(q)) return true;

  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  if (tokens.length === 0) return false;

  const matchedCount = tokens.filter((t) => haystack.includes(t)).length;
  const minMatches = tokens.length === 1 ? 1 : Math.max(2, Math.ceil(tokens.length * 0.5));
  return matchedCount >= minMatches;
}

// Mirrors the frontend's getSchemes exactly, including the comment's
// own honesty about stateFilter: both 'All' and 'Karnataka' currently
// resolve to showing the state scheme, since only one state exists in
// this data set. Kept faithful to that logic rather than "fixed",
// since it isn't actually broken with only one state modeled.
export async function getSchemes({ type = 'all', stateFilter = 'Karnataka', query = '' } = {}) {
  let list = (await governmentSchemeRepository.findAll()).map(toSchemeShape);

  if (type === 'central') {
    list = list.filter((s) => s.scope === 'central');
  } else if (type === 'state') {
    list = list.filter((s) => s.scope === 'state');
  }

  if (stateFilter !== 'All' && stateFilter !== 'Karnataka') {
    list = list.filter((s) => s.scope !== 'state');
  }

  if (query) {
    list = list.filter((s) => matchesQuery(s, query));
  }

  return list;
}

export async function getSchemeById(id) {
  const scheme = await governmentSchemeRepository.findById(id);
  return scheme ? toSchemeShape(scheme) : null;
}

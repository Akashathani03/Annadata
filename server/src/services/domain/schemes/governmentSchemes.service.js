import * as governmentSchemeRepository from '../../../repositories/governmentScheme.repository.js';

function toSchemeShape(scheme) {
  return { ...scheme.toObject(), id: scheme._id };
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
    const q = query.trim().toLowerCase();
    list = list.filter(
      (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function getSchemeById(id) {
  const scheme = await governmentSchemeRepository.findById(id);
  return scheme ? toSchemeShape(scheme) : null;
}

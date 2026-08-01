import * as governmentSchemesRepository from '../repositories/governmentSchemesRepository';

// type: 'all' | 'central' | 'state' - matches each scheme's `scope`.
// stateFilter: 'Karnataka' | 'All' - matches the prototype's
// changeSchemeState() exactly: both values currently resolve to
// showing the state scheme, since only one state (Karnataka) exists
// in this data set. Kept faithful to that logic rather than "fixed",
// since it isn't actually broken with only one state modeled.
export async function getSchemes({ type = 'all', stateFilter = 'Karnataka', query = '' } = {}) {
  let list = await governmentSchemesRepository.findAll();

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
    list = list.filter((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }

  return list;
}

export async function getSchemeById(id) {
  return governmentSchemesRepository.findById(id);
}

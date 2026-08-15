// One shared resolver, used by every module's layout (Sell Crop, Sell
// Animals, Manage Shop, and any future one) - the layout itself never
// contains conditional URL-checking logic; it only declares a small
// policy object and calls this.
//
// policy shape:
//   {
//     homeRoute: '/',                 // where 'dashboard' itself backs out to
//     defaultSegment: 'dashboard',    // used if the path has no second segment
//     parents: { segment: parentRoute },       // every top-level segment's back target
//     detailParents: { segment: parentRoute }, // for segment/:id style routes only
//   }
//
// A segment with a third path part (e.g. 'listings/abc123') is treated
// as a detail screen and checked against detailParents first; every
// other case falls back to parents, then homeRoute if not listed.
export function resolveBackRoute(pathname, policy) {
  const parts = pathname.split('/').filter(Boolean);
  const segment = parts[1] ?? policy.defaultSegment;
  const isDetailRoute = parts.length > 2;

  if (segment === policy.defaultSegment) return policy.homeRoute;
  if (isDetailRoute && policy.detailParents?.[segment]) return policy.detailParents[segment];
  return policy.parents?.[segment] ?? policy.homeRoute;
}

// Shared by authService and usersService - both need the exact same
// transformation (backend _id -> id, composed location string) and
// duplicating it would risk the two drifting out of sync, exactly the
// kind of split this whole Step 6 correction is about avoiding.
export function normalizeUser(user) {
  if (!user) return null;
  const { _id, __v, ...rest } = user;
  const location = [rest.village, rest.taluk, rest.district].filter(Boolean).join(', ');
  return { id: _id ?? user.id, ...rest, location };
}

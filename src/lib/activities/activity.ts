export type ActivityOwner = {
  email: string;
  firstName: string;
  lastName: string;
};

export function ownerLabel(user: ActivityOwner): string {
  const full = `${user.firstName} ${user.lastName}`.trim();
  return full ? full : user.email;
}

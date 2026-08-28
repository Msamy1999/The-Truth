import type { Access } from "payload";

export function userRole(user: unknown): "owner" | "reviewer" | undefined {
  if (!user || typeof user !== "object" || !("role" in user)) return undefined;
  const role = (user as { role?: unknown }).role;
  return role === "owner" || role === "reviewer" ? role : undefined;
}

export const authenticated: Access = ({ req }) => Boolean(req.user);

export const ownerOnly: Access = ({ req }) => userRole(req.user) === "owner";

export const ownerOrFirstUser: Access = async ({ req }) => {
  if (userRole(req.user) === "owner") return true;
  if (req.user) return false;
  const users = await req.payload.count({
    collection: "users",
    overrideAccess: true,
  });
  return users.totalDocs === 0;
};

export const ownerOrSelf: Access = ({ req }) => {
  if (userRole(req.user) === "owner") return true;
  if (!req.user) return false;
  return { id: { equals: req.user.id } };
};

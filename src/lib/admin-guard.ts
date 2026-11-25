import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "./auth";

// Pages admin : demande la connexion au lieu d'afficher « Page introuvable »
export async function requireAdmin(path: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(path)}`);
  return { user, admin: isAdmin(user) };
}

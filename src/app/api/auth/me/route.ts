import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { aiRemaining } from "@/lib/quota";
import { aiEnabled } from "@/lib/ai";
import { json } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ user: null });
  return json({ user: toPublicUser(user), ai: { ...(await aiRemaining(user)), enabled: aiEnabled() } });
}

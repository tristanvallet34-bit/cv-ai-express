import "server-only";
import { prisma } from "./db";
import { isPremium } from "./auth";
import { FREE_LIMITS, PREMIUM_AI_PER_DAY } from "./plans";
import type { User } from "@prisma/client";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function consumeAi(user: User) {
  const limit = isPremium(user) ? PREMIUM_AI_PER_DAY : FREE_LIMITS.aiPerDay;
  const day = today();
  const row = await prisma.aiUsage.upsert({
    where: { userId_day: { userId: user.id, day } },
    create: { userId: user.id, day, count: 0 },
    update: {},
  });
  if (row.count >= limit) return { ok: false as const, limit, remaining: 0 };
  await prisma.aiUsage.update({ where: { id: row.id }, data: { count: { increment: 1 } } });
  return { ok: true as const, limit, remaining: limit - row.count - 1 };
}

export async function aiRemaining(user: User) {
  const limit = isPremium(user) ? PREMIUM_AI_PER_DAY : FREE_LIMITS.aiPerDay;
  const row = await prisma.aiUsage.findUnique({ where: { userId_day: { userId: user.id, day: today() } } });
  return { limit, remaining: Math.max(0, limit - (row?.count || 0)) };
}

import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";
import type { User } from "@prisma/client";

const COOKIE = "cvx_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET manquant ou trop court");
    return new TextEncoder().encode("dev-only-insecure-secret-please-change");
  }
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return await prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

export function isPremium(user: Pick<User, "subscriptionStatus" | "premiumUntil"> | null | undefined) {
  if (!user) return false;
  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") return true;
  return !!user.premiumUntil && user.premiumUntil.getTime() > Date.now();
}

export function isAdmin(user: Pick<User, "email"> | null | undefined) {
  if (!user) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(user.email.toLowerCase());
}

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  premium: boolean;
  plan: string;
  premiumUntil: string | null;
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  admin: boolean;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    premium: isPremium(user),
    plan: user.plan,
    premiumUntil: user.premiumUntil?.toISOString() ?? null,
    subscriptionStatus: user.subscriptionStatus,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    admin: isAdmin(user),
  };
}

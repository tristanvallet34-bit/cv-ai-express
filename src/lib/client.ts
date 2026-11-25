"use client";
import { useCallback, useEffect, useState } from "react";

export type Me = {
  user: {
    id: string;
    email: string;
    name: string | null;
    premium: boolean;
    plan: string;
    premiumUntil: string | null;
    subscriptionStatus: string | null;
    cancelAtPeriodEnd: boolean;
    admin: boolean;
  } | null;
  ai?: { limit: number; remaining: number; enabled: boolean };
};

export class ApiError extends Error {
  status: number;
  upgrade?: boolean;
  login?: boolean;
  constructor(message: string, status: number, extra: { upgrade?: boolean; login?: boolean }) {
    super(message);
    this.status = status;
    this.upgrade = extra.upgrade;
    this.login = extra.login || status === 401;
  }
}

export async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Erreur inattendue", res.status, data);
  return data as T;
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const refresh = useCallback(async () => {
    try {
      setMe(await api<Me>("/api/auth/me"));
    } catch {
      setMe({ user: null });
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);
  return { me, refresh, setMe };
}

// Moyens de paiement configurés (Stripe, PayPal)
export function usePayMethods() {
  const [m, setM] = useState<{ stripe: boolean; paypal: boolean } | null>(null);
  useEffect(() => {
    api<{ stripe: boolean; paypal: boolean }>("/api/payments/methods").then(setM).catch(() => setM({ stripe: true, paypal: false }));
  }, []);
  return m;
}

export function resizePhoto(file: File, size = 420): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const ctx = c.getContext("2d")!;
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 3, s, s, 0, 0, size, size);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function download(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type PayProvider = "stripe" | "paypal";

export async function startCheckout(plan: string, consent: boolean, provider: PayProvider = "stripe") {
  const r = await api<{ url: string }>(provider === "paypal" ? "/api/paypal/checkout" : "/api/stripe/checkout", "POST", { plan, consent });
  window.location.href = r.url;
}

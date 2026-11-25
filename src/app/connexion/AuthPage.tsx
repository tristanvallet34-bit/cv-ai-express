"use client";
import { AuthForm } from "@/components/Modals";

export default function AuthPage({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <AuthForm initial={mode} onDone={() => (window.location.href = target)} />
      </div>
    </div>
  );
}

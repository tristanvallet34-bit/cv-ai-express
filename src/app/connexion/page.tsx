import type { Metadata } from "next";
import AuthPage from "./AuthPage";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthPage mode="login" next={next} />;
}

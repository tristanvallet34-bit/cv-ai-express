import type { Metadata } from "next";
import AuthPage from "../connexion/AuthPage";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthPage mode="register" next={next} />;
}

// Prépare la base de données au moment du build :
// - choisit SQLite (local) ou PostgreSQL (production) selon DATABASE_URL
// - crée / met à jour les tables automatiquement (prisma db push)
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";

// Charge .env en local (Vercel injecte directement les variables)
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const url = process.env.DATABASE_URL || "";
const isPg = /^postgres(ql)?:\/\//.test(url);

if (process.env.VERCEL && !isPg) {
  console.error("\n❌ DATABASE_URL manquante ou invalide.\n   Sur Vercel : onglet Storage → Create Database → Neon (Postgres) → Connect, puis redéployez.\n");
  process.exit(1);
}

const path = "prisma/schema.prisma";
const schema = readFileSync(path, "utf8");
const provider = isPg ? "postgresql" : "sqlite";
const next = schema.replace(/(datasource db \{[^}]*provider\s*=\s*)"(sqlite|postgresql)"/, `$1"${provider}"`);
if (next !== schema) {
  writeFileSync(path, next);
  console.log(`✓ Base de données : ${provider}`);
}

execSync("npx prisma generate", { stdio: "inherit" });

if (url && process.env.SKIP_DB_PUSH !== "1") {
  try {
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
    console.log("✓ Tables à jour");
  } catch {
    console.error("⚠ Mise à jour automatique des tables impossible. Lancez « npx prisma db push » manuellement.");
    if (process.env.VERCEL) process.exit(1);
  }
}

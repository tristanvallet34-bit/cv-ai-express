import type { SectionKey } from "./types";

export const LABELS: Record<"fr" | "en", Record<SectionKey | "contact" | "present" | "profile", string>> = {
  fr: {
    summary: "Profil",
    experiences: "Expérience professionnelle",
    education: "Formation",
    skills: "Compétences",
    languages: "Langues",
    certifications: "Certifications",
    projects: "Projets",
    interests: "Centres d'intérêt",
    custom: "Autres",
    contact: "Contact",
    present: "Aujourd'hui",
    profile: "Profil",
  },
  en: {
    summary: "Profile",
    experiences: "Work experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    certifications: "Certifications",
    projects: "Projects",
    interests: "Interests",
    custom: "Other",
    contact: "Contact",
    present: "Present",
    profile: "Profile",
  },
};

export const SECTION_NAMES: Record<SectionKey, string> = LABELS.fr;

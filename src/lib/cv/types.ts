export type Experience = {
  id: string;
  role: string;
  company: string;
  city: string;
  start: string;
  end: string;
  current: boolean;
  description: string;
};

export type Education = {
  id: string;
  degree: string;
  school: string;
  city: string;
  start: string;
  end: string;
  description: string;
};

export type Skill = { id: string; name: string; level: number }; // 0 = sans niveau, 1..5
export type Language = { id: string; name: string; level: string };
export type Certification = { id: string; name: string; issuer: string; date: string };
export type Project = { id: string; name: string; description: string; link: string };
export type CustomItem = { id: string; title: string; subtitle: string; date: string; description: string };

export type SectionKey =
  | "summary"
  | "experiences"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "projects"
  | "interests"
  | "custom";

export type CVData = {
  personal: {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string;
    city: string;
    website: string;
    linkedin: string;
    photo: string; // data URL
    extra: string; // ex : permis B, disponibilité
  };
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  projects: Project[];
  interests: string;
  custom: { title: string; items: CustomItem[] };
  settings: CVSettings;
};

export type CVSettings = {
  template: string;
  color: string;
  font: string;
  fontScale: number; // 0.85 .. 1.15
  spacing: number; // 0.8 .. 1.3
  showPhoto: boolean;
  lang: "fr" | "en";
  order: SectionKey[];
  hidden: SectionKey[];
};

export const DEFAULT_ORDER: SectionKey[] = [
  "summary",
  "experiences",
  "education",
  "skills",
  "languages",
  "certifications",
  "projects",
  "interests",
  "custom",
];

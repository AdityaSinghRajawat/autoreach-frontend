import { z } from "zod";

import type { ApplicationProfile, Candidate, CandidateUpdate } from "./api";

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value === "" || URL.canParse(value),
    "Enter a full URL, starting with https://",
  );

export const preferencesSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(255),
  linkedinProfileUrl: optionalUrl.refine(
    (value) => value === "" || /^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(value),
    "Use your https://linkedin.com/in/… profile link",
  ),
  minMatchScore: z.number().min(0).max(1),
  autoApplyEnabled: z.boolean(),
  autoOutreachEnabled: z.boolean(),
  timezone: z.string().min(1, "Choose a time zone"),
});

export type PreferencesValues = z.infer<typeof preferencesSchema>;

export function preferencesFromCandidate(candidate: Candidate): PreferencesValues {
  return {
    fullName: candidate.fullName,
    linkedinProfileUrl: candidate.linkedinProfileUrl ?? "",
    minMatchScore: candidate.minMatchScore,
    autoApplyEnabled: candidate.autoApplyEnabled,
    autoOutreachEnabled: candidate.autoOutreachEnabled,
    timezone: candidate.timezone,
  };
}

export function preferencesToUpdate(values: PreferencesValues): CandidateUpdate {
  return { ...values, minMatchScore: Math.round(values.minMatchScore * 100) / 100 };
}

const text = (max: number) => z.string().trim().max(max);
const yesNo = z.enum(["", "yes", "no"]);

export const applicationProfileSchema = z.object({
  phone: text(50),
  location: text(255),
  currentCompany: text(255),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  websiteUrl: optionalUrl,
  workAuthorized: yesNo,
  requiresSponsorship: yesNo,
  salaryExpectation: text(255),
  noticePeriod: text(255),
  howDidYouHear: text(255),
  coverLetter: text(10_000),
  answers: z.array(
    z.object({
      question: z.string().trim().min(1, "Enter the question as it appears on forms").max(500),
      answer: z.string().trim().min(1, "Enter an answer").max(5_000),
    }),
  ),
});

export type ApplicationProfileValues = z.infer<typeof applicationProfileSchema>;

const textFields = [
  "phone",
  "location",
  "currentCompany",
  "linkedinUrl",
  "githubUrl",
  "websiteUrl",
  "salaryExpectation",
  "noticePeriod",
  "howDidYouHear",
  "coverLetter",
] as const;

function toYesNo(value: boolean | null | undefined): "" | "yes" | "no" {
  if (value == null) {
    return "";
  }

  return value ? "yes" : "no";
}

function fromYesNo(value: "" | "yes" | "no"): boolean | null {
  return value === "" ? null : value === "yes";
}

export function formFromApplicationProfile(profile: ApplicationProfile): ApplicationProfileValues {
  const values = Object.fromEntries(
    textFields.map((field) => [field, profile[field] ?? ""]),
  ) as Record<(typeof textFields)[number], string>;

  return {
    ...values,
    workAuthorized: toYesNo(profile.workAuthorized),
    requiresSponsorship: toYesNo(profile.requiresSponsorship),
    answers: Object.entries(profile.answers ?? {}).map(([question, answer]) => ({
      question,
      answer,
    })),
  };
}

// Blank fields are left out, so they read as "not provided" instead of an empty answer.
export function applicationProfileFromForm(values: ApplicationProfileValues): ApplicationProfile {
  const profile: ApplicationProfile = {
    workAuthorized: fromYesNo(values.workAuthorized),
    requiresSponsorship: fromYesNo(values.requiresSponsorship),
    answers: values.answers.length
      ? Object.fromEntries(values.answers.map(({ question, answer }) => [question, answer]))
      : null,
  };

  for (const field of textFields) {
    if (values[field] !== "") {
      profile[field] = values[field];
    }
  }

  return profile;
}

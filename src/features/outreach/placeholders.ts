import type { OutreachChannel } from "./api";

// The backend rejects any other placeholder, so the editor only offers these.
export const placeholders = [
  { token: "{{contactFirstName}}", label: "Contact first name" },
  { token: "{{contactName}}", label: "Contact name" },
  { token: "{{contactTitle}}", label: "Contact title" },
  { token: "{{companyName}}", label: "Company" },
  { token: "{{jobTitle}}", label: "Job title" },
  { token: "{{matchingSkills}}", label: "Matching skills" },
  { token: "{{candidateFirstName}}", label: "Your first name" },
  { token: "{{candidateName}}", label: "Your name" },
  { token: "{{candidateLinkedinUrl}}", label: "Your LinkedIn" },
] as const;

const knownTokens = new Set<string>(placeholders.map((placeholder) => placeholder.token));

export function unknownPlaceholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*[^}]*\}\}/g)]
    .map((match) => match[0])
    .filter((token) => !knownTokens.has(token));
}

export const linkedinNoteLimit = 300;

export const channelLabels: Record<OutreachChannel, string> = {
  EMAIL: "Email",
  LINKEDIN_CONNECT: "LinkedIn connection request",
  LINKEDIN_DM: "LinkedIn message",
};

// Inserts at the caret of a text field and returns the new value and caret position.
export function insertAtCaret(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  current: string,
  token: string,
): { value: string; caret: number } {
  const start = element?.selectionStart ?? current.length;
  const end = element?.selectionEnd ?? current.length;

  return {
    value: current.slice(0, start) + token + current.slice(end),
    caret: start + token.length,
  };
}

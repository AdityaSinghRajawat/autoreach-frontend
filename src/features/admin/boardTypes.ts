import type { JobSource } from "./api";

export type BoardType = JobSource["boardType"];

export const boardTypes: Record<BoardType, { label: string; token: string; example: string }> = {
  GREENHOUSE: { label: "Greenhouse", token: "Board token", example: "acme" },
  LEVER: { label: "Lever", token: "Site name", example: "acme" },
  ASHBY: { label: "Ashby", token: "Job board name", example: "acme" },
  SMARTRECRUITERS: { label: "SmartRecruiters", token: "Company identifier", example: "Acme1" },
  WORKDAY: { label: "Workday", token: "Site", example: "nvidia.wd5/nvidiaexternalcareersite" },
  ADZUNA: { label: "Adzuna search", token: "Country code", example: "in" },
  CAREER_PAGE: {
    label: "Careers page",
    token: "Careers page or sitemap URL",
    example: "https://acme.com/careers",
  },
};

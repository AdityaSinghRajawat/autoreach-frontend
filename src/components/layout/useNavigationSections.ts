import { isAdmin, useSession } from "@/api/session";

import { adminNavigation, candidateNavigation, type NavSection } from "./navigation";

// Candidates see their pipeline; admins see the console, and the pipeline too when they have a profile.
export function useNavigationSections(): NavSection[] {
  const user = useSession((state) => state.user);
  const sections: NavSection[] = [];

  if (user?.candidateId) {
    sections.push(...candidateNavigation);
  }
  if (isAdmin(user)) {
    sections.push(...adminNavigation);
  }

  return sections;
}

import { UsersRound } from "lucide-react";
import { Link } from "react-router";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/cn";
import { usePageParam } from "@/lib/useSearchParam";

import { useCandidateContacts } from "../api";
import { ContactCard } from "../components/ContactCard";

export function ContactsPage() {
  const candidateId = useCandidateId();
  const [page, setPage] = usePageParam();
  const contacts = useCandidateContacts(candidateId, page);

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Recruiters and hiring managers found at the companies you matched with. Reach out to them from a job's page."
      />
      {contacts.isPending ? (
        <ListSkeleton rows={4} rowClassName="h-36" />
      ) : contacts.isError ? (
        <ErrorState error={contacts.error} onRetry={() => void contacts.refetch()} />
      ) : contacts.data.items.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No contacts yet"
          description="Open a matched job and use Find people to look up who's hiring there."
          action={
            <Link to="/jobs" className={buttonVariants({ variant: "secondary" })}>
              Go to matched jobs
            </Link>
          }
        />
      ) : (
        <>
          <div
            className={cn(
              "grid gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3",
              contacts.isPlaceholderData && "opacity-60",
            )}
          >
            {contacts.data.items.map((contact) => (
              <ContactCard key={contact.contactId} contact={contact} showCompany />
            ))}
          </div>
          <Pagination meta={contacts.data.meta} onPageChange={setPage} noun="contacts" />
        </>
      )}
    </>
  );
}

import { useCandidateId } from "@/api/session";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useSearchParam } from "@/lib/useSearchParam";

import { useApplicationProfile, useCandidate } from "../api";
import { ApplicationProfileForm } from "../components/ApplicationProfileForm";
import { PreferencesForm } from "../components/PreferencesForm";

export function ProfilePage() {
  const candidateId = useCandidateId();
  const candidate = useCandidate(candidateId);
  const applicationProfile = useApplicationProfile(candidateId);
  const [tab, setTab] = useSearchParam("tab");

  return (
    <>
      <PageHeader
        title="Profile"
        description="How AutoReach searches for you, and the answers it uses on application forms."
      />
      <Tabs
        value={tab ?? "preferences"}
        onValueChange={(value) => setTab(value === "preferences" ? null : value)}
      >
        <TabsList>
          <TabsTrigger value="preferences">Search preferences</TabsTrigger>
          <TabsTrigger value="answers">Application answers</TabsTrigger>
        </TabsList>
        <TabsContent value="preferences">
          {candidate.isPending ? (
            <ListSkeleton rows={2} rowClassName="h-48" />
          ) : candidate.isError ? (
            <ErrorState error={candidate.error} onRetry={() => void candidate.refetch()} />
          ) : (
            <PreferencesForm candidate={candidate.data} />
          )}
        </TabsContent>
        <TabsContent value="answers">
          {applicationProfile.isPending ? (
            <ListSkeleton rows={3} rowClassName="h-48" />
          ) : applicationProfile.isError ? (
            <ErrorState
              error={applicationProfile.error}
              onRetry={() => void applicationProfile.refetch()}
            />
          ) : (
            <ApplicationProfileForm candidateId={candidateId} profile={applicationProfile.data} />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

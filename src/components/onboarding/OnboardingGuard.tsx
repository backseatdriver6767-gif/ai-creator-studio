"use client";

import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { OnboardingWizard } from "./OnboardingWizard";
import { Skeleton } from "@/components/ui/skeleton";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { hasCompletedOnboarding, isLoading } = useOnboarding();

  // Show loading skeleton while checking onboarding status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // Show wizard if onboarding not completed
  if (hasCompletedOnboarding === false) {
    return <OnboardingWizard />;
  }

  // Show main app content
  return <>{children}</>;
}

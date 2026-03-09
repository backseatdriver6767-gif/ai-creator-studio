import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface OnboardingSettings {
  onboardingCompleted: boolean;
}

/**
 * Hook for managing onboarding state
 * Checks if user has completed first-run setup wizard
 */
export function useOnboarding() {
  const queryClient = useQueryClient();

  // Fetch onboarding status
  const { data, isLoading } = useQuery<OnboardingSettings>({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const res = await fetch('/api/settings/onboarding');
      if (!res.ok) {
        // If API fails, assume onboarding not completed (safe default)
        return { onboardingCompleted: false };
      }
      return res.json();
    },
    // Cache for session to avoid repeated checks
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

  // Mutation to mark onboarding as complete
  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      if (!res.ok) throw new Error('Failed to save onboarding status');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
  });

  return {
    hasCompletedOnboarding: data?.onboardingCompleted ?? null,
    isLoading,
    completeOnboarding: completeMutation.mutate,
    isCompleting: completeMutation.isPending,
  };
}

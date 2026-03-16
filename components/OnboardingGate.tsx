'use client';

import { usePathname } from 'next/navigation';
import { useMealStore } from '@/lib/store/useMealStore';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import type { UserProfile } from '@/types';

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onboardingCompleted = useMealStore((s) => s.onboardingCompleted);
  const settings = useMealStore((s) => s.settings);
  const completeOnboarding = useMealStore((s) => s.completeOnboarding);

  // Skip gate for the sign-in page so users can always access it
  if (pathname === '/sign-in') {
    return <>{children}</>;
  }

  // Show onboarding if not completed and no firstName set
  const needsOnboarding = !onboardingCompleted && !settings.firstName;

  if (needsOnboarding) {
    const handleComplete = (profile: UserProfile) => {
      completeOnboarding(profile);
    };

    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        <OnboardingFlow onComplete={handleComplete} />
      </div>
    );
  }

  return <>{children}</>;
}

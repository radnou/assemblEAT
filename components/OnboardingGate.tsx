'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useMealStore } from '@/lib/store/useMealStore';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { DisclaimerScreen } from '@/components/DisclaimerScreen';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import type { UserProfile } from '@/types';
import Link from 'next/link';

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const onboardingCompleted = useMealStore((s) => s.onboardingCompleted);
  const settings = useMealStore((s) => s.settings);
  const completeOnboarding = useMealStore((s) => s.completeOnboarding);
  const [disclaimerAccepted] = useLocalStorage('assembleat-disclaimer-accepted', false);

  // Skip gate for auth pages so users can always access them
  if (pathname === '/sign-in' || pathname === '/sign-up' || pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')) {
    return <>{children}</>;
  }

  // Wait for Clerk to load before making auth decisions
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl">🥗</div>
      </div>
    );
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

  // After onboarding, require authentication
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold">Connecte-toi pour accéder à ton dashboard</h2>
          <p className="text-sm text-gray-500">
            Ton profil a été sauvegardé. Crée un compte pour retrouver tes repas.
          </p>
          <Link
            href="/sign-up"
            className="block w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--color-cta)' }}
          >
            Créer mon compte
          </Link>
          <Link
            href="/sign-in"
            className="block text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // Show disclaimer screen if not yet accepted (after auth, before dashboard)
  if (!disclaimerAccepted) {
    return <DisclaimerScreen />;
  }

  return <>{children}</>;
}

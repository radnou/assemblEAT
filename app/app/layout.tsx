import { BottomNav } from '@/components/BottomNav';
import { InstallBanner } from '@/components/InstallBanner';
import { Toaster } from '@/components/ui/sonner';
import { HydrationProvider } from '@/components/HydrationProvider';
import { OnboardingGate } from '@/components/OnboardingGate';
import { AuthSyncProvider } from '@/components/AuthSyncProvider';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { NotificationReminderProvider } from '@/components/NotificationReminderProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HydrationProvider>
      <AuthSyncProvider>
        <OnboardingGate>
          <NotificationPrompt />
          <NotificationReminderProvider />
          <main className="pb-20 min-h-screen max-w-5xl mx-auto px-4">
            {children}
          </main>
          <BottomNav />
          <InstallBanner />
        </OnboardingGate>
        <Toaster position="top-center" />
      </AuthSyncProvider>
    </HydrationProvider>
  );
}

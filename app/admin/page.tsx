import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

// Only accessible with admin secret in URL: /admin?key=xxx
// Simple protection — not a full auth system
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY ?? 'assembleat-admin-2026';

async function getStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'assembleat' } }
  );

  const [profiles, subscriptions, feedbacks, weekPlans] = await Promise.all([
    supabase.from('profiles').select('id, first_name, plan, created_at', { count: 'exact' }),
    supabase.from('subscriptions').select('*', { count: 'exact' }).eq('status', 'active'),
    supabase.from('meal_feedbacks').select('*', { count: 'exact' }),
    supabase.from('week_plans').select('*', { count: 'exact' }),
  ]);

  return {
    totalUsers: profiles.count ?? 0,
    proUsers: subscriptions.count ?? 0,
    totalFeedbacks: feedbacks.count ?? 0,
    totalWeekPlans: weekPlans.count ?? 0,
    recentUsers: profiles.data?.slice(0, 10) ?? [],
  };
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params = await searchParams;

  if (params.key !== ADMIN_KEY) {
    redirect('/');
  }

  const stats = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AssemblEat — Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Live stats from Supabase</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
        <StatCard label="Total Users" value={stats.totalUsers} color="text-indigo-600" />
        <StatCard label="Pro Subscribers" value={stats.proUsers} color="text-emerald-600" />
        <StatCard label="Meal Feedbacks" value={stats.totalFeedbacks} color="text-amber-600" />
        <StatCard label="Week Plans" value={stats.totalWeekPlans} color="text-sky-600" />
      </div>

      {/* Recent users table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-10">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-400 text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                stats.recentUsers.map((user: { id: string; first_name?: string; plan?: string; created_at?: string }) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {user.first_name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.plan === 'pro'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.plan ?? 'free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matomo embed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Matomo Analytics</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Embedded from{' '}
            <a
              href="https://analytics.gerersci.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              analytics.gerersci.fr
            </a>
          </p>
        </div>
        <iframe
          src="https://analytics.gerersci.fr/index.php?module=Widgetize&action=iframe&idSite=2&period=day&date=today&moduleToWidgetize=CoreHome&actionToWidgetize=index"
          className="w-full"
          style={{ height: '600px', border: 'none' }}
          title="Matomo Analytics Dashboard"
        />
      </div>
    </div>
  );
}

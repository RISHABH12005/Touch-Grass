'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const savedUser = localStorage.getItem('tg_user');
      if (!savedUser) {
        router.push('/');
        return;
      }
      
      const userData = JSON.parse(savedUser);
      setUser(userData);

      try {
        const [challengeRes, statsRes] = await Promise.all([
          fetch('/api/challenges'),
          fetch(`/api/stats?userId=${userData.id}`)
        ]);

        if (!challengeRes.ok) throw new Error('Failed to load challenge');
        if (!statsRes.ok) throw new Error('Failed to load stats');

        setChallenge(await challengeRes.json());
        setStats(await statsRes.json());
      } catch (e: any) {
        console.error('Error loading dashboard', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center h-screen text-green-600 font-bold text-xl animate-pulse">Loading your progress...</div>;
  if (!user) return null;

  const progressPercentage = stats?.nextMilestone 
    ? Math.min(100, Math.round((stats.totalDays / stats.nextMilestone.requiredDays) * 100))
    : 0;

  return (
    <PageContainer>
      <header className="text-center mb-12 space-y-2">
        <h1 className="text-4xl md:text-6xl font-black text-green-700 tracking-tight">Touch Grass</h1>
        <p className="text-gray-500 text-lg md:text-xl font-medium">Welcome back, {user.name}!</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card 
            title="Today's Challenge" 
            className="bg-green-50/50 border-green-200 shadow-sm h-full"
          >
            <div className="space-y-6">
              {challenge ? (
                <>
                  <div className="space-y-3">
                    <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                      {challenge.title}
                    </p>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push('/challenge')}
                    className="w-full sm:w-auto px-10"
                  >
                    Upload Photo
                  </Button>
                </>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <p className="text-xl text-gray-500 font-medium">No challenge available for today.</p>
                  <p className="text-sm text-gray-400">Check back tomorrow to continue your streak!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card title="Your Progress" className="bg-white shadow-sm">
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <p className="text-2xl">🔥</p>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Streak</p>
                  <p className="text-2xl font-black text-gray-800">{stats?.currentStreak || 0} Days</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <p className="text-2xl">🌿</p>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Days</p>
                  <p className="text-2xl font-black text-gray-800">{stats?.totalDays || 0}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Next Reward</p>
                    <p className="text-lg font-bold text-gray-800">{stats?.nextMilestone?.name || 'None'}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    {stats?.totalDays || 0} / {stats?.nextMilestone?.requiredDays || '—'} Days
                  </p>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-700 ease-out" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

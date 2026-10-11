'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/ui/PageContainer';

type User = { id: string; name: string };
type Challenge = { title: string; description: string };
type Stats = {
  currentStreak?: number;
  totalDays?: number;
  nextMilestone?: { name: string; requiredDays: number } | null;
};

function LeafIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M24 41V21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 28C12 28 7 20 8 10C19 10 26 16 24 28Z" fill="#BDE28F" />
      <path d="M24 34C36 34 42 26 40 16C29 16 22 22 24 34Z" fill="#7EB56A" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (userData: User) => {
    setLoading(true);
    setError(null);
    try {
      const [challengeRes, statsRes] = await Promise.all([
        fetch('/api/challenges', { cache: 'no-store' }),
        fetch(`/api/stats?userId=${encodeURIComponent(userData.id)}`, { cache: 'no-store' }),
      ]);
      if (!challengeRes.ok && challengeRes.status !== 404) throw new Error('Today’s challenge could not be loaded.');
      if (!statsRes.ok) throw new Error('Your progress could not be loaded.');
      setChallenge(challengeRes.ok ? await challengeRes.json() : null);
      setStats(await statsRes.json());
    } catch (cause) {
      console.error('Error loading dashboard', cause);
      setError(cause instanceof Error ? cause.message : 'Something went wrong while loading your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('tg_user');
    if (!savedUser) {
      router.replace('/');
      return;
    }
    try {
      const userData = JSON.parse(savedUser) as User;
      if (!userData?.id || !userData?.name) throw new Error('Invalid saved user');
      setUser(userData);
      void loadDashboard(userData);
    } catch {
      localStorage.removeItem('tg_user');
      router.replace('/');
    }
  }, [router, loadDashboard]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08110d] px-4 text-[#e8f0e8]">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111d17] px-6 py-5">
          <span className="h-3 w-3 rounded-full bg-[#a8df78] motion-safe:animate-pulse motion-reduce:animate-none" />
          <p className="font-semibold">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  const firstName = user.name.trim().split(/\s+/)[0];
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const totalDays = typeof stats?.totalDays === 'number' ? stats.totalDays : null;
  const streak = typeof stats?.currentStreak === 'number' ? stats.currentStreak : null;
  const milestone = stats?.nextMilestone ?? null;
  const progress = milestone?.requiredDays && totalDays !== null
    ? Math.min(100, Math.max(0, Math.round((totalDays / milestone.requiredDays) * 100)))
    : null;
  const remaining = milestone && totalDays !== null ? Math.max(0, milestone.requiredDays - totalDays) : null;

  return (
    <div className="min-h-screen overflow-hidden bg-[#08110d] text-[#e8f0e8]">
      <div className="pointer-events-none fixed inset-0 opacity-30" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(#345340 0.7px, transparent 0.7px)', backgroundSize: '24px 24px' }} />
      <PageContainer className="relative z-10 mx-auto max-w-[1180px] py-5 sm:py-8 lg:py-10">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#193626] text-[#c8e8a9]">
              <LeafIcon />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">touch grass<span className="text-[#a8df78]">.</span></p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#82968a]">JUET outdoor club</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#dce9dd]">Hey, {firstName}</p>
            <p className="mt-0.5 text-xs text-[#82968a]">{today}</p>
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-400/[0.08] px-5 py-4 text-sm text-amber-100">
            <span>{error}</span>
            <button type="button" onClick={() => user && void loadDashboard(user)} className="rounded-lg px-3 py-2 font-bold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">
              Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <section aria-labelledby="challenges-title" className="group relative overflow-hidden rounded-[1.7rem] border border-[#35513e] bg-gradient-to-br from-[#173625] via-[#12281c] to-[#101c16] p-6 shadow-[0_24px_70px_-45px_rgba(112,187,105,0.5)] sm:p-8 lg:col-span-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-[#b5dd9a]/10 transition-transform duration-700 group-hover:rotate-12 motion-reduce:transition-none" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-8 -top-10 h-48 w-48 rounded-full border border-dashed border-[#b5dd9a]/10" aria-hidden="true" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#a8c79c]">A fresh start, every day</p>
                  <h1 id="challenges-title" className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Today’s Challenges</h1>
                </div>
                <span className="rounded-full border border-[#b5dd9a]/15 bg-[#b5dd9a]/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#c8e8a9]">Today</span>
              </div>

              {challenge ? (
                <div className="mt-8 max-w-xl">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b5dd9a]/10 text-2xl" aria-hidden="true">🧭</div>
                  <h2 className="text-xl font-extrabold leading-snug text-[#edf5e9] sm:text-2xl">{challenge.title}</h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-[#afc0b2] sm:text-base">{challenge.description}</p>
                </div>
              ) : (
                <div className="mt-8 max-w-xl">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b5dd9a]/10 text-2xl" aria-hidden="true">🌿</div>
                  <h2 className="text-xl font-extrabold text-[#edf5e9]">No challenge posted today</h2>
                  <p className="mt-3 text-sm leading-6 text-[#afc0b2]">There’s nothing scheduled right now. Check back later for the next outdoor challenge.</p>
                </div>
              )}
              <div className="mt-auto flex items-center gap-2 pt-8 text-xs font-semibold text-[#809487]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a8df78]" />
                Live challenge from the JUET outdoor club
              </div>
            </div>
          </section>

          <section aria-labelledby="task-title" className="flex flex-col justify-between rounded-[1.7rem] border border-white/[0.09] bg-[#111b16] p-6 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.8)] sm:p-7 lg:col-span-5">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#82968a]">Your next step</p>
                  <h2 id="task-title" className="mt-2 text-xl font-black tracking-tight text-white">Task</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a8df78]/10 text-lg" aria-hidden="true">📷</span>
              </div>
              <div className="mt-7 rounded-2xl border border-white/[0.07] bg-[#0b1510] p-4">
                <p className="font-bold text-[#e5eee5]">{challenge ? 'Complete today’s challenge' : 'Ready when a challenge is posted'}</p>
                <p className="mt-2 text-sm leading-6 text-[#91a397]">{challenge ? 'Head outside, take a photo, and check in to record your moment.' : 'Your photo check-in will be available with the next challenge.'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/challenge')}
              disabled={!challenge}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a8df78] px-5 py-3 text-sm font-extrabold text-[#102015] transition duration-200 hover:-translate-y-0.5 hover:bg-[#c0ed96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3f2b4] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 motion-reduce:transition-none"
            >
              Upload a photo <ArrowIcon />
            </button>
          </section>

          <section aria-labelledby="badge-title" className="relative overflow-hidden rounded-[1.7rem] border border-[#4a4330] bg-gradient-to-br from-[#282416] to-[#171710] p-6 sm:p-7 lg:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#c3ac6b]">Keep exploring</p>
                <h2 id="badge-title" className="mt-2 text-xl font-black tracking-tight text-white">Badge</h2>
              </div>
              <span className="text-2xl" aria-hidden="true">✦</span>
            </div>
            {milestone ? (
              <div className="mt-6 flex items-center gap-5">
                <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full border border-[#d2b867]/25 bg-[#d2b867]/[0.07] motion-safe:animate-[pulse_4s_ease-in-out_infinite] motion-reduce:animate-none">
                  <div className="absolute inset-2 rounded-full border border-dashed border-[#d2b867]/30" />
                  <span className="text-4xl" aria-hidden="true">🏅</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ae9c6d]">Next milestone</p>
                  <p className="mt-1 text-lg font-extrabold text-[#f2e8c8]">{milestone.name}</p>
                  <p className="mt-1 text-sm text-[#b0a783]">{remaining === null ? 'Progress unavailable' : `${remaining} day${remaining === 1 ? '' : 's'} to go`}</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-5">
                <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                  <span className="text-4xl opacity-70" aria-hidden="true">🏅</span>
                </div>
                <p className="max-w-xs text-sm leading-6 text-[#b0a783]">A badge will show here when one is available.</p>
              </div>
            )}
            {milestone && progress !== null && totalDays !== null && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#b0a783]">
                  <span>Progress</span><span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/30" role="progressbar" aria-label={`Progress toward ${milestone.name}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-gradient-to-r from-[#c59f48] to-[#f0d98b] transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-right text-[11px] text-[#9c916c]">{totalDays} / {milestone.requiredDays} days outside</p>
              </div>
            )}
          </section>

          <section aria-labelledby="streak-title" className="overflow-hidden rounded-[1.7rem] border border-[#315143] bg-gradient-to-br from-[#142a20] to-[#101b16] p-6 sm:p-7 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#87aa91]">Small steps add up</p>
                <h2 id="streak-title" className="mt-2 text-xl font-black tracking-tight text-white">Streak &amp; Days Outside</h2>
              </div>
              <span className="rounded-full border border-[#a8df78]/15 bg-[#a8df78]/[0.07] px-3 py-1.5 text-xs font-bold text-[#bfe39e]">Your progress</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-white/[0.07] bg-[#0c1711]/80 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#91a99a]">
                  <span className="text-lg" aria-hidden="true">🔥</span> Current streak
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{streak ?? '—'}<span className="ml-2 text-sm font-bold text-[#8ba091]">days</span></p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-[#0c1711]/80 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#91a99a]">
                  <span className="text-lg" aria-hidden="true">🌳</span> Days outside
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{totalDays ?? '—'}</p>
              </div>
            </div>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}

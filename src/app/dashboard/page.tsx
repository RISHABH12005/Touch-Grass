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

const outdoorTips = [
  { title: 'Take the scenic route', text: 'A five-minute walk between classes is still a win. Choose the path with a little more green.' },
  { title: 'Notice three things', text: 'Find one thing moving, one thing growing, and one sound you usually walk past.' },
  { title: 'Bring a friend along', text: 'A small outdoor break is even better with someone to share it with.' },
  { title: 'Leave your phone in your pocket', text: 'Give yourself ten minutes to be here, not everywhere.' },
  { title: 'Find your patch of green', text: 'A tree, a garden, a quiet courtyard—your reset spot does not need to be far away.' },
];

function LeafMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M24 41V21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 28C12 28 7 20 8 10C19 10 26 16 24 28Z" fill="#BDE28F" />
      <path d="M24 34C36 34 42 26 40 16C29 16 22 22 24 34Z" fill="#7EB56A" />
      <path d="M24 21C24 14 29 9 35 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  const loadDashboard = useCallback(async (userData: User, quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [challengeRes, statsRes] = await Promise.all([
        fetch('/api/challenges', { cache: 'no-store' }),
        fetch(`/api/stats?userId=${encodeURIComponent(userData.id)}`, { cache: 'no-store' }),
      ]);
      if (!challengeRes.ok && challengeRes.status !== 404) throw new Error('We could not load today’s challenge.');
      if (!statsRes.ok) throw new Error('We could not load your progress.');
      setChallenge(challengeRes.ok ? await challengeRes.json() : null);
      setStats(await statsRes.json());
    } catch (e) {
      console.error('Error loading dashboard', e);
      setError(e instanceof Error ? e.message : 'Something went wrong while loading your dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f0] px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e0e9dc] bg-white px-6 py-5 shadow-sm">
          <span className="h-3 w-3 animate-pulse rounded-full bg-[#178342]" />
          <p className="font-semibold text-[#23412c]">Growing your dashboard…</p>
        </div>
      </main>
    );
  }

  const totalDays = stats?.totalDays ?? 0;
  const streak = stats?.currentStreak ?? 0;
  const nextMilestone = stats?.nextMilestone;
  const progress = nextMilestone?.requiredDays
    ? Math.min(100, Math.round((totalDays / nextMilestone.requiredDays) * 100))
    : 100;
  const firstName = user.name.trim().split(/\s+/)[0];
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const tip = outdoorTips[tipIndex];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f7f0] text-[#183323]">
      <div className="pointer-events-none fixed inset-0 opacity-50" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(#b7cdb0 0.7px, transparent 0.7px)', backgroundSize: '22px 22px' }} />
      <PageContainer className="relative z-10 max-w-[1400px] py-5 sm:py-8 lg:py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#173e2a] text-[#d6edbd] shadow-lg shadow-green-950/10">
              <LeafMark />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-[#173e2a]">touch grass<span className="text-[#168344]">.</span></p>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#809080]">JUET outdoor club</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-[#23412c]">{firstName}'s field notes</p>
              <p className="text-xs text-[#819080]">{today}</p>
            </div>
            <button
              type="button"
              onClick={() => user && void loadDashboard(user, true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-[#dce7d8] bg-white/85 px-4 py-2.5 text-sm font-bold text-[#31553a] shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c5a1] hover:shadow-md disabled:opacity-60"
              aria-label="Refresh dashboard"
            >
              <svg className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5m10-1a7 7 0 0 0-12-4L4 12m16 0-2 5a7 7 0 0 1-12 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="hidden sm:inline">{refreshing ? 'Refreshing' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        <section className="relative mb-7 overflow-hidden rounded-[2rem] bg-[#173e2a] px-6 py-8 text-white shadow-[0_24px_60px_-35px_rgba(23,62,42,0.65)] sm:px-9 sm:py-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-white/10 sm:right-12 sm:top-[-9rem] sm:h-[26rem] sm:w-[26rem]" />
          <div className="pointer-events-none absolute -right-4 top-10 h-44 w-44 rounded-full border border-white/10 sm:right-36 sm:top-14 sm:h-64 sm:w-64" />
          <div className="pointer-events-none absolute bottom-[-5rem] right-[22%] h-52 w-52 rounded-full bg-[#9bc878]/10 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c8e5b2]/20 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#d8edc7]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#b8df8d]" />
                Your outside era starts now
              </div>
              <h1 className="text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Hey, {firstName}.<br />
                <span className="text-[#c8e5a7]">Let’s get out there.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                A little fresh air can change the whole day. Take a break, find something green, and make this one count.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/challenge')}
                  disabled={!challenge}
                  className="group inline-flex items-center gap-3 rounded-full bg-[#bfe49b] px-6 py-3.5 font-extrabold text-[#183923] shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#d1f0b5] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Start today’s challenge <span className="transition-transform group-hover:translate-x-1"><ArrowIcon /></span>
                </button>
                <span className="text-sm text-white/60">One small step is still a step.</span>
              </div>
            </div>
            <div className="relative mx-auto flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48 lg:mr-6 lg:h-56 lg:w-56">
              <div className="absolute inset-0 rounded-full border border-white/15" />
              <div className="absolute inset-4 rounded-full border border-dashed border-[#c8e5a7]/35" />
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#c8e5a7]/10 text-7xl sm:h-36 sm:w-36 sm:text-8xl" aria-hidden="true">🌱</div>
              <span className="absolute right-0 top-6 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#d9edca]">GO SLOW</span>
              <span className="absolute bottom-4 left-0 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#d9edca]">STAY CURIOUS</span>
            </div>
          </div>
        </section>

        {error && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <span>{error}</span>
            <button type="button" onClick={() => user && void loadDashboard(user, true)} className="font-bold underline underline-offset-4">Try again</button>
          </div>
        )}

        <section className="mb-7 grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
          <article className="group overflow-hidden rounded-[1.7rem] border border-[#e0e8dc] bg-white shadow-[0_12px_36px_-28px_rgba(24,51,35,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_-30px_rgba(24,51,35,0.4)]">
            <div className="flex items-center justify-between border-b border-[#edf1e9] px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#82917d]">The daily mission</p>
                <h2 className="mt-1 text-lg font-extrabold text-[#1d3826]">Today’s challenge</h2>
              </div>
              <span className="rounded-full bg-[#edf6e8] px-3 py-1.5 text-xs font-bold text-[#417345]">01 / DAY</span>
            </div>
            <div className="grid gap-5 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f7eb] text-2xl" aria-hidden="true">🧭</div>
                {challenge ? (
                  <>
                    <h3 className="text-2xl font-black tracking-tight text-[#203a28] sm:text-3xl">{challenge.title}</h3>
                    <p className="mt-3 max-w-xl leading-7 text-[#6c7b6b]">{challenge.description}</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-black tracking-tight text-[#203a28]">A little pause, just for you.</h3>
                    <p className="mt-3 max-w-xl leading-7 text-[#6c7b6b]">There isn’t a challenge published today. Check back soon, or take a short walk anyway.</p>
                  </>
                )}
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#71816f]">
                  <span className="rounded-full bg-[#f5f7f2] px-3 py-2">↗ Get outdoors</span>
                  <span className="rounded-full bg-[#f5f7f2] px-3 py-2">◎ Capture a moment</span>
                  <span className="rounded-full bg-[#f5f7f2] px-3 py-2">✳ Build a habit</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/challenge')}
                disabled={!challenge}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#168342] px-5 py-3 font-bold text-white shadow-md shadow-green-900/10 transition hover:-translate-y-0.5 hover:bg-[#126d36] disabled:cursor-not-allowed disabled:opacity-50 md:self-end"
              >
                Check in <ArrowIcon />
              </button>
            </div>
          </article>

          <article className="rounded-[1.7rem] border border-[#e0e8dc] bg-white p-6 shadow-[0_12px_36px_-28px_rgba(24,51,35,0.35)] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#82917d]">Little wins add up</p>
                <h2 className="mt-1 text-lg font-extrabold text-[#1d3826]">Your progress</h2>
              </div>
              <span className="text-2xl" aria-hidden="true">🌿</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#f5f8f2] p-4">
                <p className="text-xl" aria-hidden="true">🔥</p>
                <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#82917d]">Current streak</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-[#203a28]">{streak} <span className="text-sm font-bold text-[#82917d]">days</span></p>
              </div>
              <div className="rounded-2xl bg-[#f5f8f2] p-4">
                <p className="text-xl" aria-hidden="true">🌳</p>
                <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#82917d]">Days outside</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-[#203a28]">{totalDays}</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-[#e8eee4] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#82917d]">Next milestone</p>
                  <p className="mt-1 font-extrabold text-[#203a28]">{nextMilestone?.name || 'Your next adventure'}</p>
                </div>
                <p className="whitespace-nowrap text-xs font-bold text-[#648163]">{nextMilestone ? `${totalDays} / ${nextMilestone.requiredDays}` : 'In progress'}</p>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#edf1e9]" role="progressbar" aria-label="Progress to next reward" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-gradient-to-r from-[#78ae5e] to-[#168342] transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-[#82917d]">{nextMilestone ? `${Math.max(0, nextMilestone.requiredDays - totalDays)} more day${Math.max(0, nextMilestone.requiredDays - totalDays) === 1 ? '' : 's'} to your next reward.` : 'Every check-in counts. Keep going.'}</p>
            </div>
          </article>
        </section>

        <section className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
          <article className="relative overflow-hidden rounded-[1.7rem] border border-[#d9e6d2] bg-[#e7f1df] p-6 sm:p-7">
            <div className="pointer-events-none absolute -bottom-10 -right-5 text-[9rem] opacity-[0.12]" aria-hidden="true">☀</div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#64805c]">A tiny nudge</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-[#203a28]">{tip.title}</h2>
            <p className="relative mt-3 max-w-lg text-sm leading-6 text-[#526b50]">{tip.text}</p>
            <button
              type="button"
              onClick={() => setTipIndex((current) => (current + 1) % outdoorTips.length)}
              className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-[#c4d8b9] bg-white/70 px-4 py-2.5 text-sm font-bold text-[#315a37] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#6e9d5d]/20"
            >
              Another little nudge <ArrowIcon />
            </button>
            <p className="relative mt-3 text-[11px] font-semibold text-[#789071]">TIP {tipIndex + 1} OF {outdoorTips.length}</p>
          </article>

          <article className="rounded-[1.7rem] border border-[#e0e8dc] bg-white p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#82917d]">Your next chapter</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-[#203a28]">Make room for real life.</h2>
              </div>
              <span className="rounded-full bg-[#f5f8f2] px-3 py-1.5 text-xs font-bold text-[#648163]">No pressure. Just progress.</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#edf1e9] p-4 transition hover:border-[#c9dec0] hover:bg-[#fbfdf9]">
                <span className="text-2xl" aria-hidden="true">👀</span>
                <p className="mt-3 text-sm font-extrabold text-[#2a4630]">Look around</p>
                <p className="mt-1 text-xs leading-5 text-[#82917d]">Notice something new on campus.</p>
              </div>
              <div className="rounded-2xl border border-[#edf1e9] p-4 transition hover:border-[#c9dec0] hover:bg-[#fbfdf9]">
                <span className="text-2xl" aria-hidden="true">🚶</span>
                <p className="mt-3 text-sm font-extrabold text-[#2a4630]">Take a lap</p>
                <p className="mt-1 text-xs leading-5 text-[#82917d]">A short walk counts, too.</p>
              </div>
              <div className="rounded-2xl border border-[#edf1e9] p-4 transition hover:border-[#c9dec0] hover:bg-[#fbfdf9]">
                <span className="text-2xl" aria-hidden="true">📸</span>
                <p className="mt-3 text-sm font-extrabold text-[#2a4630]">Save the moment</p>
                <p className="mt-1 text-xs leading-5 text-[#82917d]">Check in when you’re ready.</p>
              </div>
            </div>
          </article>
        </section>

        <footer className="flex flex-col items-center justify-between gap-2 px-2 pb-2 pt-8 text-center text-xs font-medium text-[#8a9987] sm:flex-row sm:text-left">
          <p className="flex items-center gap-2"><LeafMark className="h-5 w-5 text-[#6e9d5d]" /> Made for the JUET student community.</p>
          <p>Less scrolling. More living.</p>
        </footer>
      </PageContainer>
    </main>
  );
}

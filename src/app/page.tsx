'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', studentId: '', studentEmail: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('tg_user', JSON.stringify(data));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-[#dce3d8] bg-[#fbfcf9] px-4 py-3.5 text-[#203426] outline-none transition placeholder:text-[#a1aba0] hover:border-[#a9bda2] focus:border-[#47784b] focus:ring-4 focus:ring-[#47784b]/10';

  return (
    <PageContainer className="relative flex items-center justify-center overflow-hidden min-h-screen bg-black px-4 py-10 sm:px-6 lg:py-16">
      <main className="relative z-10 mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_30px_100px_-45px_rgba(34,65,36,0.35)] backdrop-blur-xl lg:min-h-[610px] lg:grid-cols-[1.04fr_0.96fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#173e2a] p-7 text-white sm:p-10 lg:p-12">
          <div aria-hidden="true" className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-12 top-32 h-48 w-48 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-[#6e9b58]/20 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#dcebd5]">
              <span className="h-2 w-2 rounded-full bg-[#b7d98c]" />
              THE JUET OUTDOOR CHALLENGE
            </div>
            <div className="mt-12 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner">
              <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
                <path d="M24 39V20" stroke="#D7E9B7" strokeWidth="3" strokeLinecap="round" />
                <path d="M24 27C12 27 8 20 8 10C18 10 25 14 24 27Z" fill="#A9CC83" />
                <path d="M24 33C36 33 41 25 40 16C30 16 23 21 24 33Z" fill="#78A765" />
                <path d="M24 20C24 14 28 9 35 7" stroke="#D7E9B7" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="mt-7 max-w-md text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl">
              A little more
              <span className="mt-2 block text-[#c7e3a7]">outside.</span>
              A lot more
              <span className="mt-2 block text-[#c7e3a7]">alive.</span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-white/70 sm:text-lg">
              Step away from the screen. Find your patch of green. Make every day a small adventure.
            </p>
          </div>
          <div className="relative mt-12 grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
            <div><p className="text-2xl font-bold tracking-tight">01</p><p className="mt-1 text-xs text-white/60 sm:text-sm">Daily challenge</p></div>
            <div><p className="text-2xl font-bold tracking-tight">02</p><p className="mt-1 text-xs text-white/60 sm:text-sm">Photo check-in</p></div>
            <div><p className="text-2xl font-bold tracking-tight">03</p><p className="mt-1 text-xs text-white/60 sm:text-sm">Build a streak</p></div>
          </div>
        </section>

        <section className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5b8050]">Your next chapter starts here</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d3023] sm:text-4xl">Come on in.</h2>
            <p className="mt-3 max-w-sm leading-6 text-[#6d786d]">Enter your JUET roll number, name, and student email to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

            <div className="space-y-2">
              <label htmlFor="student-id" className="block text-sm font-semibold text-[#344638]">Er. Roll. No.</label>
              <input id="student-id" name="studentId" type="text" autoComplete="username" required maxLength={80} className={inputClass} placeholder="231B264" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value.trim().toUpperCase() })} />
            </div>

            <div className="space-y-2">
              <label htmlFor="full-name" className="block text-sm font-semibold text-[#344638]">Name</label>
              <input id="full-name" name="name" type="text" autoComplete="name" required maxLength={100} className={inputClass} placeholder="Rishabh Jain" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <label htmlFor="student-email" className="block text-sm font-semibold text-[#344638]">Student Email</label>
              <input id="student-email" name="studentEmail" type="email" autoComplete="email" required maxLength={254} pattern="[^\s@]+@juetguna\.in" title="Use your JUET student email ending in @juetguna.in" className={inputClass} placeholder="231B264@juetguna.in" value={form.studentEmail} onChange={e => setForm({ ...form, studentEmail: e.target.value.trim().toLowerCase() })} />
              <p className="text-xs text-[#879187]">Use your official JUET email address.</p>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Start my challenge <span aria-hidden="true" className="ml-2">→</span>
            </Button>
            <p className="text-center text-xs leading-5 text-[#879187]">Small steps count. Show up, get outside, and keep going.</p>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#edf0e9] pt-5 text-xs text-[#899389]">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-[#62845a]" aria-hidden="true">
              <path d="M10 2.5 16 5v4.2c0 3.7-2.5 6.4-6 8.3-3.5-1.9-6-4.6-6-8.3V5l6-2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="m7.2 9.8 1.8 1.8 3.8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Made for the JUET student community
          </div>
        </section>
      </main>
    </PageContainer>
  );
}

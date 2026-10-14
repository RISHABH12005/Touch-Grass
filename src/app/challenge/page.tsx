'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/ui/PageContainer';

type User = { id: string; name: string };
type Challenge = { id: string; title: string; description: string };
type UploadStatus = 'idle' | 'success' | 'error';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ChallengePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [challengeError, setChallengeError] = useState('');
  const [completedToday, setCompletedToday] = useState(false);
  const [completionLoading, setCompletionLoading] = useState(true);
  const [completionError, setCompletionError] = useState('');
  const [nextChallengeAt, setNextChallengeAt] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const loadChallenge = useCallback(async () => {
    setChallengeLoading(true);
    setChallengeError('');
    try {
      const response = await fetch('/api/challenges', { cache: 'no-store' });
      if (response.status === 404) {
        setChallenge(null);
        return;
      }
      if (!response.ok) throw new Error('Could not load today’s challenge.');
      setChallenge(await response.json());
    } catch (cause) {
      setChallengeError(cause instanceof Error ? cause.message : 'Could not load today’s challenge.');
    } finally {
      setChallengeLoading(false);
    }
  }, []);

  const loadCompletion = useCallback(async (userId: string) => {
    setCompletionLoading(true);
    setCompletionError('');
    try {
      const response = await fetch(`/api/challenges/status?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not check today’s challenge status.');
      const data = await response.json() as { completed?: boolean; nextChallengeAt?: string };
      const complete = data.completed === true;
      setCompletedToday(complete);
      if (complete) setStatus('success');
      else setStatus('idle');
      setNextChallengeAt(typeof data.nextChallengeAt === 'string' ? data.nextChallengeAt : null);
    } catch (cause) {
      setCompletionError(cause instanceof Error ? cause.message : 'Could not check today’s challenge status.');
    } finally {
      setCompletionLoading(false);
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
      void loadChallenge();
      void loadCompletion(userData.id);
    } catch {
      localStorage.removeItem('tg_user');
      router.replace('/');
    }
  }, [loadChallenge, loadCompletion, router]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = (file?: File) => {
    if (!file || completedToday || completionLoading || completionError) return;
    setStatus('idle');
    setErrorMessage('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setStatus('error');
      setErrorMessage('Please choose a JPEG, PNG, or WEBP photo.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setStatus('error');
      setErrorMessage('That photo is over 5 MB. Choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setStatus('error');
        setErrorMessage('This photo could not be opened. Please choose another one.');
        return;
      }
      setImageBase64(reader.result);
      setPreviewUrl(URL.createObjectURL(file));
      setFileName(file.name);
    };
    reader.onerror = () => {
      setStatus('error');
      setErrorMessage('This photo could not be opened. Please choose another one.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    selectFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (!uploading && !completedToday && !completionLoading && !completionError) selectFile(event.dataTransfer.files?.[0]);
  };

  const clearPhoto = () => {
    setImageBase64(null);
    setFileName('');
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setStatus('idle');
    setErrorMessage('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!imageBase64 || !user || !challenge || uploading || completedToday || completionLoading || completionError) return;
    setUploading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, imageBase64 }),
      });
      const data = await response.json().catch(() => ({})) as {
        success?: boolean;
        verified?: boolean;
        reason?: string;
        error?: string;
        completed?: boolean;
      };

      if (data.completed) {
        setCompletedToday(true);
        setStatus('success');
        setErrorMessage('');
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Your photo could not be submitted. Please try again.');
      }
      if (!data.verified) {
        setStatus('error');
        setErrorMessage(data.reason || 'The photo could not be verified. Try another photo in good light.');
        return;
      }
      setCompletedToday(true);
      setStatus('success');
    } catch (cause) {
      setStatus('error');
      setErrorMessage(cause instanceof Error ? cause.message : 'Something went wrong while submitting your photo.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!user || !nextChallengeAt) return;
    const delay = Math.max(0, new Date(nextChallengeAt).getTime() - Date.now() + 500);
    const timer = window.setTimeout(() => {
      setImageBase64(null);
      setFileName('');
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setCompletedToday(false);
      setStatus('idle');
      setErrorMessage('');
      void loadChallenge();
      void loadCompletion(user.id);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [loadChallenge, loadCompletion, nextChallengeAt, user]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080d0b] px-4 text-[#e6efe8]">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111b16] px-6 py-5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#a8df78] motion-safe:animate-pulse motion-reduce:animate-none" />
          <p className="font-semibold">Getting your check-in ready…</p>
        </div>
      </main>
    );
  }

  return (
    <PageContainer className="min-h-screen bg-[#080d0b] py-5 text-[#e6efe8] sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#aebdb2] transition-colors hover:border-[#a8df78]/40 hover:bg-[#a8df78]/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8df78] motion-reduce:transition-none"
            aria-label="Back to dashboard"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.19em] text-[#89a38f]">JUET outdoor club · daily check-in</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Submit your challenge</h1>
          </div>
        </header>

        <ol aria-label="Check-in steps" className="mb-7 flex items-center gap-2 text-xs font-bold sm:mb-9 sm:gap-3">
          <li className="flex items-center gap-2 rounded-full border border-[#a8df78]/20 bg-[#a8df78]/[0.08] px-3 py-2 text-[#d6edc2]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#a8df78] text-[10px] text-[#102015]">1</span>
            Challenge
          </li>
          <span className="h-px w-5 bg-white/15 sm:w-10" aria-hidden="true" />
          <li aria-current={imageBase64 ? undefined : 'step'} className={"flex items-center gap-2 rounded-full border px-3 py-2 " + (imageBase64 ? 'border-[#a8df78]/20 bg-[#a8df78]/[0.08] text-[#d6edc2]' : 'border-white/10 bg-white/[0.03] text-[#84968a]')}>
            <span className={"grid h-5 w-5 place-items-center rounded-full text-[10px] " + (imageBase64 ? 'bg-[#a8df78] text-[#102015]' : 'bg-white/10 text-[#aebdb2]')}>2</span>
            Photo
          </li>
          <span className="h-px w-5 bg-white/15 sm:w-10" aria-hidden="true" />
          <li aria-current={status === 'success' ? 'step' : undefined} className={"flex items-center gap-2 rounded-full border px-3 py-2 " + (status === 'success' ? 'border-[#a8df78]/20 bg-[#a8df78]/[0.08] text-[#d6edc2]' : 'border-white/10 bg-white/[0.03] text-[#84968a]')}>
            <span className={"grid h-5 w-5 place-items-center rounded-full text-[10px] " + (status === 'success' ? 'bg-[#a8df78] text-[#102015]' : 'bg-white/10 text-[#aebdb2]')}>3</span>
            Verify
          </li>
        </ol>

        {challengeError && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-100">
            <span>{challengeError}</span>
            <button type="button" onClick={() => void loadChallenge()} className="rounded-lg px-3 py-2 font-bold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">Try again</button>
          </div>
        )}
        {completionError && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-100">
            <span>{completionError} Uploading is disabled until the status is confirmed.</span>
            <button type="button" onClick={() => user && void loadCompletion(user.id)} className="rounded-lg px-3 py-2 font-bold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">Try again</button>
          </div>
        )}
        {completedToday && (
          <div role="status" aria-live="polite" className="mb-6 flex items-center gap-3 rounded-2xl border border-[#a8df78]/25 bg-[#a8df78]/[0.09] px-5 py-4 text-sm text-[#d6edc2]">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#a8df78] font-black text-[#102015]" aria-hidden="true">✓</span>
            <div><p className="font-extrabold">Today’s challenge is complete</p><p className="mt-1 text-[#b5c9aa]">Your next challenge opens tomorrow. Photo uploads are locked for today.</p></div>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-8">
          <section aria-labelledby="mission-title" className="rounded-[1.7rem] border border-white/[0.08] bg-[#101914] p-5 sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#8fa596]">Today’s mission</p>
            {challengeLoading ? (
              <div className="mt-6 space-y-3" aria-live="polite">
                <div className="h-6 w-2/3 animate-pulse rounded-lg bg-white/[0.08] motion-reduce:animate-none" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none" />
              </div>
            ) : challenge ? (
              <div className="mt-4 border-l-2 border-[#a8df78] pl-4">
                <h2 id="mission-title" className="text-xl font-black leading-tight text-white sm:text-2xl">{challenge.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#a5b6aa]">{challenge.description}</p>
              </div>
            ) : (
              <div className="mt-4 border-l-2 border-amber-300/50 pl-4">
                <h2 id="mission-title" className="text-lg font-bold text-white">No challenge is available today</h2>
                <p className="mt-2 text-sm leading-6 text-[#a5b6aa]">Photo check-in will be available when the next challenge is posted.</p>
              </div>
            )}
            <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#0a100c] p-4">
              <span className="mt-0.5 text-lg" aria-hidden="true">🌱</span>
              <p className="text-xs leading-5 text-[#8fa194]">Frame the outdoor activity clearly. Your photo is checked against today’s challenge before it counts toward your streak.</p>
            </div>
          </section>

          <section aria-labelledby="photo-title" className="rounded-[1.7rem] border border-white/[0.08] bg-[#101914] p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#8fa596]">Your moment outside</p>
                <h2 id="photo-title" className="mt-1 text-lg font-extrabold text-white">Add a photo</h2>
              </div>
              {fileName && <span className="max-w-full truncate rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-[#afc1b2]">{fileName}</span>}
            </div>

            <div
              onDragEnter={(event) => { event.preventDefault(); if (!uploading && !completedToday && !completionLoading && !completionError && challenge) setDragActive(true); }}
              onDragOver={(event) => { event.preventDefault(); if (!uploading && !completedToday && !completionLoading && !completionError && challenge) setDragActive(true); }}
              onDragLeave={(event) => { event.preventDefault(); if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false); }}
              onDrop={handleDrop}
              className={"relative isolate min-h-[290px] overflow-hidden rounded-2xl border-2 border-dashed transition-colors sm:min-h-[360px] " + (dragActive ? 'border-[#b9eb8c] bg-[#a8df78]/[0.12]' : imageBase64 ? 'border-[#719b5c]/70 bg-[#0a100c]' : 'border-[#34453a] bg-[#0b120d] hover:border-[#719b5c] hover:bg-[#101b14]') + (!challenge || uploading || completedToday || completionLoading || Boolean(completionError) ? ' opacity-60' : '') + ' motion-reduce:transition-none'}
              aria-label="Photo upload area"
            >
              {previewUrl && (
                <Image src={previewUrl} alt="Preview of the selected challenge photo" fill unoptimized className="object-contain p-2" />
              )}
              <label
                htmlFor="challenge-photo"
                className={"absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center p-6 text-center focus-within:outline focus-within:outline-2 focus-within:outline-offset-[-6px] focus-within:outline-[#b9eb8c] " + (previewUrl ? 'bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100 motion-reduce:transition-none' : '')}
              >
                {!imageBase64 ? (
                  <>
                    <span className={"mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-[#a8df78]/15 bg-[#a8df78]/[0.08] text-3xl transition-transform " + (dragActive ? 'scale-110' : '') + ' motion-reduce:transition-none'} aria-hidden="true">
                      {dragActive ? '↓' : '📷'}
                    </span>
                    <span className="text-base font-extrabold text-[#edf5e9]">{dragActive ? 'Drop your photo to add it' : 'Drop a photo here'}</span>
                    <span className="mt-2 text-sm font-semibold text-[#a8df78] underline underline-offset-4">or browse your files</span>
                    <span id="upload-hint" className="mt-3 text-xs text-[#809286]">JPEG, PNG, or WEBP · up to 5 MB</span>
                  </>
                ) : (
                  <span className="mt-auto rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm">Choose a different photo</span>
                )}
              </label>
              <input
                ref={inputRef}
                id="challenge-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={!challenge || uploading || completedToday || completionLoading || Boolean(completionError)}
                className="peer sr-only"
                aria-describedby="upload-hint"
              />
              {imageBase64 && !uploading && !completedToday && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute right-3 top-3 z-20 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-[#080d0b]/85 px-3.5 text-xs font-bold text-white backdrop-blur transition-colors hover:border-red-300/40 hover:bg-red-950/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9eb8c] motion-reduce:transition-none"
                  aria-label="Remove selected photo"
                >
                  <span aria-hidden="true">×</span> Remove
                </button>
              )}
            </div>

            <p className="mt-3 text-xs leading-5 text-[#7f9084]">Your image is sent securely for challenge verification after you submit.</p>

            {errorMessage && (
              <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-red-300/20 bg-red-400/[0.08] px-4 py-3 text-sm leading-6 text-red-100">
                <span className="font-bold" aria-hidden="true">!</span>
                <p>{errorMessage}</p>
              </div>
            )}
            {status === 'success' && (
              <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded-xl border border-[#a8df78]/20 bg-[#a8df78]/[0.08] px-4 py-3 text-sm font-bold text-[#d6edc2]">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#a8df78] text-xs text-[#102015]" aria-hidden="true">✓</span>
                Today’s challenge is complete. Your progress is saved; the next challenge opens tomorrow.
              </div>
            )}

            <div className="mt-5">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!imageBase64 || !challenge || uploading || completionLoading || Boolean(completionError) || completedToday || status === 'success'}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a8df78] px-5 py-3 text-sm font-extrabold text-[#102015] transition duration-200 hover:-translate-y-0.5 hover:bg-[#c0ed96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3f2b4] disabled:cursor-not-allowed disabled:bg-[#3a4b3d] disabled:text-[#8da092] disabled:hover:translate-y-0 motion-reduce:transition-none"
              >
                {completedToday ? 'Completed for today' : uploading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-[#102015]/30 border-t-[#102015] motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Verifying photo…
                  </>
                ) : status === 'success' ? 'Verified and complete' : 'Submit for verification'}
              </button>
              {status === 'success' && (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="mt-3 min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-[#dce9dd] transition-colors hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8df78] motion-reduce:transition-none"
                >
                  Dashboard
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

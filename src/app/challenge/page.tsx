'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ChallengePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function load() {
      const savedUser = localStorage.getItem('tg_user');
      if (!savedUser) {
        router.push('/');
        return;
      }
      setUser(JSON.parse(savedUser));
      try {
        const res = await fetch('/api/challenges');
        if (!res.ok) throw new Error('Failed to fetch challenge');
        setChallenge(await res.json());
      } catch (e: any) {
        console.error(e);
        setStatus('error');
        setErrorMessage('Could not load challenge. Please refresh.');
      }
    }
    load();
  }, [router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Invalid file type. Please upload JPEG, PNG or WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!image) return;
    setUploading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          imageBase64: image,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.verified) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.reason || 'AI could not verify the image.');
        }
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center h-screen text-green-600 font-bold text-xl">Loading...</div>;

  return (
    <PageContainer>
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Submit Challenge</h1>
      </header>

      <div className="max-w-2xl mx-auto space-y-8">
        {challenge ? (
          <Card title="Today's Challenge" className="bg-green-50/50 border-green-200 shadow-sm">
            <div className="space-y-3">
              <p className="text-xl font-bold text-gray-800 leading-tight">{challenge.title}</p>
              <p className="text-gray-600 leading-relaxed">{challenge.description}</p>
            </div>
          </Card>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-200 text-gray-500 font-medium">
            No challenge available for today. Please check back later.
          </div>
        )}

        <div className="space-y-6 text-center">
          <div className="relative aspect-video md:aspect-square max-w-[450px] mx-auto bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all hover:border-green-400 group cursor-pointer">
            {image ? (
              <div className="relative w-full h-full">
                <img src={image} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-300" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-bold text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Change Photo</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-400 group-hover:text-gray-500 transition-colors">
                <p className="text-6xl mb-4">📷</p>
                <p className="font-semibold text-lg">Take or upload a photo</p>
                <p className="text-sm mt-1">JPEG, PNG or WEBP (Max 5MB)</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handleFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <p className="text-sm text-gray-500 italic">Your photo will be verified by AI</p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          {status === 'success' && (
            <div className="w-full max-w-sm p-4 bg-green-100 text-green-800 rounded-2xl text-center font-bold border border-green-200 animate-bounce">
              ✓ Challenge Completed!
            </div>
          )}

          {status === 'error' && (
            <div className="w-full max-w-sm p-4 bg-red-100 text-red-800 rounded-2xl text-center font-medium border border-red-200">
              ✕ {errorMessage}
            </div>
          )}

          <Button 
            onClick={handleSubmit}
            disabled={!image || uploading}
            className="w-full max-w-sm"
          >
            {uploading ? 'Verifying with AI...' : 'Submit for Verification'}
          </Button>

          {status === 'success' && (
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="secondary"
              className="w-full max-w-sm"
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

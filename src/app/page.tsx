'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', studentId: '' });
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
        setError(data.error || 'Login failed');
      }
    } catch (e) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="flex items-center justify-center">
      <div className="w-full max-w-[450px] mx-auto space-y-10 py-12">
        <div className="text-center space-y-3">
          <h1 className="text-5xl md:text-6xl font-black text-green-700 tracking-tight">
            Touch Grass
          </h1>
          <p className="text-gray-500 text-lg md:text-xl font-medium">
            JUET Outdoor Challenge
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-200 text-center font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 ml-1">Full Name</label>
              <input 
                type="text" 
                required 
                className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="Enter your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 ml-1">Student ID</label>
              <input 
                type="text" 
                required 
                className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="Enter your JUET ID"
                value={form.studentId}
                onChange={e => setForm({ ...form, studentId: e.target.value })}
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Enter Challenge
            </Button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}

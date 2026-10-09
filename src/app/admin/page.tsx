'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'challenges' | 'submissions'>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let endpoint = '';
      if (activeTab === 'users') endpoint = '/api/admin/users';
      if (activeTab === 'challenges') endpoint = '/api/admin/challenges';
      if (activeTab === 'submissions') endpoint = '/api/admin/submissions';
      
      try {
        const res = await fetch(endpoint, {
          headers: { 'Authorization': 'Bearer ' }
        });
        setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTab]);

  return (
    <PageContainer>
      <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
          {(['users', 'challenges', 'submissions'] as const).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 font-medium">Loading data...</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-3xl shadow-sm">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-bold">
              <tr className="border-b border-gray-100">
                {activeTab === 'users' && (
                  <>
                    <th className="p-4">Name</th>
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Created</th>
                  </>
                )}
                {activeTab === 'challenges' && (
                  <>
                    <th className="p-4">Title</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Status</th>
                  </>
                )}
                {activeTab === 'submissions' && (
                  <>
                    <th className="p-4">User</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Confidence</th>
                    <th className="p-4">Reason</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  {activeTab === 'users' && (
                    <>
                      <td className="p-4">{item.name}</td>
                      <td className="p-4">{item.studentId}</td>
                      <td className="p-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                    </>
                  )}
                  {activeTab === 'challenges' && (
                    <>
                      <td className="p-4 font-medium">{item.title}</td>
                      <td className="p-4 text-gray-600">{item.description}</td>
                      <td className="p-4">{item.active ? '✅' : '❌'}</td>
                    </>
                  )}
                  {activeTab === 'submissions' && (
                    <>
                      <td className="p-4">{item.userId}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.verified ? 'Verified' : 'Rejected'}
                        </span>
                      </td>
                      <td className="p-4">{item.confidence?.toFixed(2) || 'N/A'}</td>
                      <td className="p-4 text-sm text-gray-600">{item.reason}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <div className="p-20 text-center text-gray-400">No data found</div>}
        </div>
      )}
    </PageContainer>
  );
}

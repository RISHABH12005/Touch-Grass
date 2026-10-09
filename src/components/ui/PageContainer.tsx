'use client';
import React from 'react';

export default function PageContainer({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <main className={`min-h-screen w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 ${className}`}>
      <div className="max-w-[1200px] mx-auto w-full">
        {children}
      </div>
    </main>
  );
}

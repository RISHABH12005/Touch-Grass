'use client';
import React from 'react';

export default function Card({ children, className = '', title, subtitle }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          {title && <h3 className="text-lg font-bold text-gray-800">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

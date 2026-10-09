'use client';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export default function Button({ children, variant = 'primary', loading, className = '', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
    secondary: 'bg-gray-800 text-white hover:bg-black',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button 
      className={`${variants[variant]} py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.35 0 0 5.65 0 12h4z" />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

const baseClass =
  'rounded-xl px-6 py-3 font-semibold shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400';

const variantClass: Record<string, string> = {
  primary: 'bg-yellow-500 text-white hover:bg-yellow-600 active:scale-95',
  secondary: 'bg-white text-yellow-600 border border-yellow-500 hover:bg-yellow-100 active:scale-95',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95',
};

export default function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(baseClass, variantClass[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

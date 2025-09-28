import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}

const baseClass =
  'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

const variantClass: Record<string, string> = {
  primary: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 focus:ring-yellow-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95',
  secondary: 'bg-white text-orange-600 hover:bg-orange-50 border border-orange-500 hover:border-orange-600 focus:ring-orange-300 shadow-sm',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
  outline: 'bg-transparent text-yellow-600 border border-yellow-500 hover:bg-yellow-50 focus:ring-yellow-300',
};

const sizeClass: Record<string, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg min-w-[80px]',
  md: 'px-6 py-3 text-base rounded-xl min-w-[100px]',
  lg: 'px-8 py-4 text-lg rounded-xl min-w-[120px]',
};

const Button = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  fullWidth = false,
  asChild = false,
  ...props
}: ButtonProps) {
  const buttonClass = clsx(
    baseClass,
    variantClass[variant],
    sizeClass[size],
    fullWidth && 'w-full',
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      className: clsx(buttonClass, children.props?.className),
    } as any);
  }

  return (
    <button
      className={buttonClass}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;

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
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

const variantClass: Record<string, string> = {
  primary: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 focus:ring-yellow-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95',
  secondary: 'bg-white text-orange-600 hover:bg-orange-50 border border-orange-500 hover:border-orange-600 focus:ring-orange-300 shadow-sm',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
  outline: 'bg-transparent text-yellow-600 border border-yellow-500 hover:bg-yellow-50 focus:ring-yellow-300',
};

const sizeClass: Record<string, string> = {
  sm: 'px-3 py-2 text-sm rounded-lg min-h-[44px]',
  md: 'px-4 py-2.5 text-sm sm:text-base rounded-xl min-h-[46px]',
  lg: 'px-5 py-3 text-base sm:text-lg rounded-xl min-h-[50px]',
};

const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  fullWidth = false,
  asChild = false,
  ...props
}, ref) {
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
      ref={ref}
      className={buttonClass}
      {...props}
    >
      {children}
    </button>
  );
}));

Button.displayName = 'Button';

export default Button;

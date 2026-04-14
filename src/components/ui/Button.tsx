import React from 'react';
import { cn } from './cn';

type ButtonVariant = 'primary' | 'primary-sm' | 'secondary' | 'ghost' | 'danger' | 'danger-sm' | 'confirm' | 'danger-confirm';

type ButtonProps = React.JSX.IntrinsicElements['button'] & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  // Icon-friendly buttons (flex layout)
  'primary':         'flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  'primary-sm':      'flex items-center gap-2 px-3 py-1.5 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  'secondary':       'flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  'ghost':           'px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  'danger-sm':       'flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  // Modal confirm buttons (no icon layout)
  'confirm':         'px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  'danger':          'px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  'danger-confirm':  'px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
};

export function Button({
  variant = 'primary',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </button>
  );
}

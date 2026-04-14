import React from 'react';
import { cn } from './cn';

const baseClasses = 'w-full px-3 py-2 border rounded-lg text-sm outline-none transition-all';
const focusClasses = 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
const errorFocusClasses = 'focus:ring-2 focus:ring-red-200 focus:border-red-500';

type InputProps = React.JSX.IntrinsicElements['input'] & { error?: boolean };

export function Input({ error, className, disabled, ...props }: InputProps) {
  return (
    <input
      disabled={disabled}
      className={cn(
        baseClasses,
        error ? `border-red-300 ${errorFocusClasses}` : `border-gray-200 ${focusClasses}`,
        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white',
        className
      )}
      {...props}
    />
  );
}

type TextareaProps = React.JSX.IntrinsicElements['textarea'] & { error?: boolean };

export function Textarea({ error, className, disabled, ...props }: TextareaProps) {
  return (
    <textarea
      disabled={disabled}
      className={cn(
        baseClasses,
        'resize-none',
        error ? `border-red-300 ${errorFocusClasses}` : `border-gray-200 ${focusClasses}`,
        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white',
        className
      )}
      {...props}
    />
  );
}

type SelectProps = React.JSX.IntrinsicElements['select'] & { error?: boolean };

export function Select({ error, className, disabled, children, ...props }: SelectProps) {
  return (
    <select
      disabled={disabled}
      className={cn(
        baseClasses,
        error ? `border-red-300 ${errorFocusClasses}` : `border-gray-200 ${focusClasses}`,
        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

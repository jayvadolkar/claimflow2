import React from 'react';
import { cn } from './cn';

export type BadgeVariant =
  | 'emerald' | 'amber' | 'red' | 'blue' | 'gray'
  | 'indigo' | 'orange' | 'purple' | 'rose';

export type BadgeStyle = 'status' | 'pill' | 'subtle';

interface BadgeProps {
  variant?: BadgeVariant;
  badgeStyle?: BadgeStyle;
  children: React.ReactNode;
  className?: string;
}

// status: uppercase tracking label badges (e.g. Verified, Rejected, decision types)
// pill: rounded-full count/tag badges
// subtle: soft inline badges (inline-flex)
const styleBaseClasses: Record<BadgeStyle, string> = {
  status: 'px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded',
  pill:   'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
  subtle: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
};

const variantColorMap: Record<BadgeVariant, Record<BadgeStyle, string>> = {
  emerald: {
    status: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    pill:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
    subtle: 'bg-emerald-100 text-emerald-700',
  },
  amber: {
    status: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    pill:   'bg-amber-50 text-amber-700 border border-amber-200',
    subtle: 'bg-amber-100 text-amber-700',
  },
  red: {
    status: 'bg-red-500/20 text-red-400 border border-red-500/30',
    pill:   'bg-red-50 text-red-600 border border-red-200',
    subtle: 'bg-red-100 text-red-700',
  },
  blue: {
    status: 'bg-blue-100 text-blue-700',
    pill:   'bg-blue-100 text-blue-800',
    subtle: 'bg-blue-100 text-blue-800',
  },
  gray: {
    status: 'bg-gray-200 text-gray-600',
    pill:   'bg-gray-100 text-gray-500',
    subtle: 'bg-gray-100 text-gray-800',
  },
  indigo: {
    status: 'bg-indigo-100 text-indigo-700',
    pill:   'bg-indigo-50 text-indigo-700 border border-indigo-200',
    subtle: 'bg-blue-100 text-blue-800',
  },
  orange: {
    status: 'bg-orange-50 text-orange-600',
    pill:   'bg-orange-50 text-orange-700',
    subtle: 'bg-orange-100 text-orange-700',
  },
  purple: {
    status: 'bg-purple-100 text-purple-700',
    pill:   'bg-purple-50 text-purple-700 border border-purple-200',
    subtle: 'bg-purple-100 text-purple-700',
  },
  rose: {
    status: 'bg-rose-50 text-rose-700',
    pill:   'bg-rose-50 text-rose-700 border border-rose-200',
    subtle: 'bg-rose-100 text-rose-700',
  },
};

export function Badge({
  variant = 'gray',
  badgeStyle = 'status',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        styleBaseClasses[badgeStyle],
        variantColorMap[variant][badgeStyle],
        className
      )}
    >
      {children}
    </span>
  );
}

import React from 'react';
import { cn } from './cn';

type ThProps = React.JSX.IntrinsicElements['th'] & { sticky?: boolean };

export function Th({ sticky, className, children, ...props }: ThProps) {
  return (
    <th
      className={cn(
        sticky
          ? 'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10'
          : 'py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

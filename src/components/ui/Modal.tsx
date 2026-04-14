import React, { useEffect } from 'react';
import { cn } from './cn';

const maxWidthClasses = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  '2xl': 'max-w-2xl',
} as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: keyof typeof maxWidthClasses;
  /** Use for stacked modals that need z-indexes beyond 50 (e.g. 200, 250, 300) */
  zIndex?: number;
  /** Apply backdrop-blur-sm to the overlay */
  blur?: boolean;
  /** Dismiss the modal when clicking the overlay */
  closeOnOverlayClick?: boolean;
  panelClassName?: string;
}

export function Modal({
  open,
  onClose,
  children,
  maxWidth = 'md',
  zIndex = 50,
  blur = false,
  closeOnOverlayClick = false,
  panelClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4',
        blur ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/50'
      )}
      style={{ zIndex }}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={cn(
          'bg-white rounded-xl shadow-xl w-full',
          maxWidthClasses[maxWidth],
          panelClassName
        )}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  onClose,
  className,
}: {
  title: string;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <button
        onClick={onClose}
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex justify-end gap-3 mt-6', className)}>
      {children}
    </div>
  );
}

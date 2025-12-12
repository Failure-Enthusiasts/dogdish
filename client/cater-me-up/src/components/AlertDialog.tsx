'use client';

import { useEffect } from 'react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  confirmText?: string;
}

export default function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK'
}: AlertDialogProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Type-specific styling
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          buttonBg: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          icon: '✕',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: '⚠',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          icon: 'ℹ',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonBg: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const styles = getTypeStyles();
  const displayTitle = title || (type.charAt(0).toUpperCase() + type.slice(1));
  const titleId = "alert-dialog-title";
  const descId = "alert-dialog-description";

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 animate-in fade-in duration-200"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex items-start space-x-4">
          <div
            className={`${styles.iconBg} ${styles.iconColor} rounded-full w-10 h-10 flex items-center justify-center shrink-0 text-xl font-bold`}
            aria-hidden="true"
          >
            {styles.icon}
          </div>
          <div className="flex-1">
            <h3
              id={titleId}
              className="text-lg font-semibold mb-2 text-gray-900"
            >
              {displayTitle}
            </h3>
            <p
              id={descId}
              className="text-gray-600 mb-6"
            >
              {message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className={`px-6 py-2 ${styles.buttonBg} text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                autoFocus
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

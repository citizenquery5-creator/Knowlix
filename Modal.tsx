import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export default function Modal({ open, onClose, title, children, size = 'md', showClose = true }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-neutral-900 rounded-3xl shadow-elevated border border-neutral-100 dark:border-neutral-800 animate-scale-in max-h-[90vh] flex flex-col`}>
        {(title || showClose) && (
          <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            {title && <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">{title}</h2>}
            {showClose && (
              <button
                onClick={onClose}
                className="ml-auto btn-ghost p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

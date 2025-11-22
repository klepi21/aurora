'use client';
import { ToastComponent, Toast } from './Toast';

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  return (
    <div className='fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none'>
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
      {toasts.map((toast) => (
        <div key={toast.id} className='pointer-events-auto'>
          <ToastComponent toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};


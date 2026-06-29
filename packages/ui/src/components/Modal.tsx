import * as React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#111] border border-[#2A2A2A] rounded-lg p-6 max-w-lg w-full mx-4">
        {(title != null || onClose != null) && (
          <div className="flex items-center justify-between mb-4">
            {title != null && <h2 className="text-lg font-semibold text-[#D6D3C7]">{title}</h2>}
            {onClose != null && (
              <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#D6D3C7]">✕</button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

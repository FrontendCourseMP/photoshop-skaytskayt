import { useCallback, useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [handleClose]);

  return (
    <dialog ref={dialogRef} className={className}>
      {children}
    </dialog>
  );
}

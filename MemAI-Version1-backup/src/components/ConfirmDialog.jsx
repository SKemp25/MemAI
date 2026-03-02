import { useEffect, useId, useRef } from 'react';
import './ConfirmDialog.css';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Focus cancel by default (safer for destructive actions)
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = [cancelRef.current, confirmRef.current].filter(Boolean);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="confirm-title" id={titleId}>
          {title}
        </h2>
        {description && (
          <p className="confirm-description" id={descId}>
            {description}
          </p>
        )}
        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-cancel"
            onClick={onCancel}
            ref={cancelRef}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-confirm ${destructive ? 'destructive' : ''}`}
            onClick={onConfirm}
            ref={confirmRef}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


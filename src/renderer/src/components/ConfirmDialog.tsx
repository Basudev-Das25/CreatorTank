import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/Button';
import { modalPop, overlayFade } from '../lib/animations';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const variantConfig: Record<string, { bg: string; color: string }> = {
    danger: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
    warning: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    primary: { bg: 'var(--primary-light)', color: 'var(--primary)' },
  };

  const config = variantConfig[variant] || variantConfig.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={overlayFade.initial}
          animate={overlayFade.animate}
          exit={overlayFade.exit}
          transition={overlayFade.transition}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--overlay-bg)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={modalPop.initial}
            animate={modalPop.animate}
            exit={modalPop.exit}
            transition={modalPop.transition}
            style={{
              background: 'var(--card-bg)',
              width: 'min(400px, calc(100vw - 32px))',
              padding: 'var(--space-6)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ background: config.bg, color: config.color, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
                <AlertTriangle size={24} />
              </div>
              <Button variant="ghost" size="sm" onClick={onCancel} icon={<X size={20} />} />
            </div>

            {/* Content */}
            <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-extrabold)', color: 'var(--text-main)' }}>
              {title}
            </h3>
            <p style={{ margin: '0 0 var(--space-6)', color: 'var(--text-muted)', lineHeight: 'var(--leading-normal)', fontSize: 'var(--text-base)' }}>
              {message}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button variant="secondary" onClick={onCancel} style={{ flex: 1, padding: 'var(--space-3)' }}>
                {cancelLabel}
              </Button>
              <Button
                onClick={onConfirm}
                style={{
                  flex: 1,
                  padding: 'var(--space-3)',
                  background: config.color,
                  color: '#ffffff',
                  fontWeight: 'var(--weight-bold)',
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

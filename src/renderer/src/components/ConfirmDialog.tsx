import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

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
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    variant = 'danger'
}: ConfirmDialogProps) {
    const getVariantColor = () => {
        switch (variant) {
            case 'danger': return 'var(--danger)';
            case 'warning': return 'var(--warning)';
            default: return 'var(--primary)';
        }
    };

    const getVariantBg = () => {
        switch (variant) {
            case 'danger': return 'rgba(239, 68, 68, 0.1)';
            case 'warning': return 'rgba(245, 158, 11, 0.1)';
            default: return 'var(--primary-light)';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={overlayStyle} onClick={onCancel}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        style={modalStyle}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{
                                background: getVariantBg(),
                                color: getVariantColor(),
                                padding: '12px',
                                borderRadius: '12px',
                                display: 'flex'
                            }}>
                                <AlertTriangle size={24} />
                            </div>
                            <button onClick={onCancel} style={closeBtnStyle}>
                                <X size={20} />
                            </button>
                        </div>

                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {title}
                        </h3>
                        <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                            {message}
                        </p>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={onCancel} style={cancelBtnStyle}>
                                {cancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                style={{
                                    ...confirmBtnStyle,
                                    background: getVariantColor()
                                }}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000
};

const modalStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    width: '400px',
    padding: '32px',
    borderRadius: '24px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)'
};

const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px'
};

const cancelBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontWeight: 700,
    color: 'var(--text-main)',
    cursor: 'pointer',
    transition: 'var(--transition)'
};

const confirmBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 700,
    color: 'white',
    cursor: 'pointer',
    transition: 'var(--transition)'
};

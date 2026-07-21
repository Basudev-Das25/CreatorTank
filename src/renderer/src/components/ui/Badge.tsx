import React from 'react';

interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'primary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge({ variant, size = 'sm', children, style }: BadgeProps) {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '2px 8px', fontSize: 'var(--text-xs)' },
    md: { padding: '4px 10px', fontSize: 'var(--text-sm)' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    success: { background: 'var(--success-bg)', color: 'var(--success-text)' },
    warning: { background: 'var(--warning-bg)', color: 'var(--warning-text)' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger-text)' },
    info: { background: 'var(--primary-light)', color: 'var(--primary)' },
    muted: { background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' },
    primary: { background: 'var(--primary)', color: 'var(--text-inverse)' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 'var(--weight-medium)',
        borderRadius: 'var(--radius-full)',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

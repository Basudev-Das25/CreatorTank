import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'sunken';
  padding?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassPanel({
  children,
  variant = 'default',
  padding = 'var(--space-4)',
  className,
  style,
}: GlassPanelProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-blur))',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
    },
    elevated: {
      background: 'var(--card-bg)',
      border: '1px solid var(--border-strong)',
      boxShadow: 'var(--shadow-lg)',
    },
    sunken: {
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
    },
  };

  return (
    <div
      className={className}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

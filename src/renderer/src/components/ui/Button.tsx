import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  style,
  ...props
}: ButtonProps) {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sm)', gap: '6px' },
    md: { padding: '8px 16px', fontSize: 'var(--text-base)', borderRadius: 'var(--radius-md)', gap: '8px' },
    lg: { padding: '12px 20px', fontSize: 'var(--text-md)', borderRadius: 'var(--radius-md)', gap: '10px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--primary)',
      color: 'var(--text-inverse)',
      fontWeight: 'var(--weight-semibold)',
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-main)',
      border: '1px solid var(--border-strong)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
    danger: {
      background: 'var(--danger)',
      color: '#ffffff',
      fontWeight: 'var(--weight-semibold)',
    },
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={
        variant === 'ghost'
          ? { backgroundColor: 'var(--primary-light)' }
          : variant === 'primary'
          ? { backgroundColor: 'var(--primary-hover)' }
          : { backgroundColor: 'var(--card-bg-hover)' }
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
        whiteSpace: 'nowrap',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...(props as any)}
    >
      {icon}
      {children}
    </motion.button>
  );
}

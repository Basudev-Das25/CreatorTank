import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function Input({ prefix, suffix, style, ...props }: InputProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '8px 12px',
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        transition: 'var(--transition-fast)',
      }}
    >
      {prefix && (
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {prefix}
        </span>
      )}
      <input
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-main)',
          fontSize: 'var(--text-base)',
          fontFamily: 'inherit',
          minWidth: 0,
          ...style,
        }}
        {...props}
      />
      {suffix && (
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'prefix'> {
  prefix?: React.ReactNode;
}

export function Select({ prefix, style, children, ...props }: SelectProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '8px 12px',
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        transition: 'var(--transition-fast)',
      }}
    >
      {prefix && (
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {prefix}
        </span>
      )}
      <select
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-main)',
          fontSize: 'var(--text-base)',
          fontFamily: 'inherit',
          cursor: 'pointer',
          minWidth: 0,
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

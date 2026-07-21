import React from 'react';

interface SectionHeaderProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function SectionHeader({ children, style }: SectionHeaderProps) {
  return (
    <h4
      style={{
        margin: 0,
        padding: 0,
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-extrabold)',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        ...style,
      }}
    >
      {children}
    </h4>
  );
}

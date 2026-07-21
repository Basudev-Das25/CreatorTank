import React from 'react';
import { motion } from 'framer-motion';
import { emptyStateEntrance } from '../../lib/animations';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={emptyStateEntrance.initial}
      animate={emptyStateEntrance.animate}
      transition={emptyStateEntrance.transition}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-10)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
          color: 'var(--primary)',
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-main)',
          marginBottom: 'var(--space-1)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            maxWidth: '280px',
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          style={{ marginTop: 'var(--space-4)' }}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

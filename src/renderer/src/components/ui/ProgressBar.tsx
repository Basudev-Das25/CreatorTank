import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ProgressBar({ value, size = 'sm', showLabel = false }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const height = size === 'sm' ? '4px' : '6px';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <div
        style={{
          flex: 1,
          height,
          background: 'var(--border)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            background: clampedValue === 100 ? 'var(--success)' : 'var(--primary)',
            borderRadius: 'var(--radius-full)',
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', minWidth: '32px' }}>
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}

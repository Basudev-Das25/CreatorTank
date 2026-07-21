import React from 'react';

interface ResizableHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
  id?: string;
  style?: React.CSSProperties;
}

export function ResizableHandle({ onMouseDown, isResizing, id, style }: ResizableHandleProps) {
  return (
    <div
      id={id}
      onMouseDown={onMouseDown}
      style={{
        width: '6px',
        cursor: 'col-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
        background: isResizing ? 'var(--primary-light)' : 'transparent',
        transition: 'background var(--transition-fast)',
        ...style,
      }}
      className="resizable-handle"
    >
      <div
        style={{
          width: '2px',
          height: isResizing ? '48px' : '32px',
          borderRadius: 'var(--radius-full)',
          background: isResizing ? 'var(--primary)' : 'var(--border-strong)',
          transition: 'all var(--transition-normal)',
          opacity: isResizing ? 1 : 0.5,
        }}
      />
      <style>{`
        .resizable-handle:hover {
          background: var(--primary-light) !important;
        }
        .resizable-handle:hover div {
          height: 48px !important;
          opacity: 1 !important;
          background: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}

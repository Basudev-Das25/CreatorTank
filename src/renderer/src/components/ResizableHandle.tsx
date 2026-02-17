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
                width: '4px',
                cursor: 'col-resize',
                background: isResizing ? 'var(--primary)' : 'transparent',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                position: 'relative',
                ...style
            }}
            className="resizable-handle"
        >
            <div style={{
                width: '1px',
                height: '40px',
                background: isResizing ? 'var(--primary)' : 'var(--border)',
                opacity: 0.5,
                borderRadius: '1px'
            }} />

            <style>
                {`
                .resizable-handle:hover {
                    background: var(--primary-light) !important;
                }
                .resizable-handle:hover div {
                    background: var(--primary) !important;
                    opacity: 1 !important;
                }
                `}
            </style>
        </div>
    );
}

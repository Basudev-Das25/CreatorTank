import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Lightbulb, Folder, X } from 'lucide-react';

interface SearchResult {
    item_type: 'project' | 'idea' | 'script';
    item_id: number;
    project_id: number;
    idea_id?: number;
    title: string;
    content: string;
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectResult: (type: string, projectId: number, ideaId?: number) => void;
}

export function SearchModal({ isOpen, onClose, onSelectResult }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                const res = await window.api.searchAll(query);
                if (res.success) {
                    setResults(res.data || []);
                }
                setLoading(false);
            } else {
                setResults([]);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'project': return <Folder size={14} />;
            case 'idea': return <Lightbulb size={14} />;
            case 'script': return <FileText size={14} />;
            default: return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.4)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        paddingTop: '120px',
                        backdropFilter: 'blur(8px)'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            width: '640px',
                            maxHeight: '480px',
                            background: 'var(--card-bg)',
                            borderRadius: '20px',
                            boxShadow: 'var(--shadow-lg)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Search size={24} style={{ color: 'var(--primary)', opacity: 0.7 }} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search everything... (Ctrl + K)"
                                style={{
                                    flex: 1,
                                    fontSize: '1.25rem',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'var(--text-main)',
                                    background: 'transparent',
                                    fontWeight: 500
                                }}
                            />
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Searching deep into your tank...</div>}

                            {!loading && query && results.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No matches found for "{query}"
                                </div>
                            )}

                            {results.map((res, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    key={`${res.item_type}-${res.item_id}`}
                                    onClick={() => onSelectResult(res.item_type, res.project_id, res.idea_id)}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}
                                    className="search-item"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{res.title}</div>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            textTransform: 'uppercase',
                                            fontWeight: 800,
                                            color: res.item_type === 'project' ? 'var(--primary)' : res.item_type === 'idea' ? '#10b981' : '#f59e0b',
                                            background: 'var(--primary-light)',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {getItemIcon(res.item_type)}
                                            {res.item_type}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {res.content}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
            <style>
                {`
                .search-item:hover { background: var(--bg); transform: translateX(4px); }
                `}
            </style>
        </AnimatePresence>
    );
}

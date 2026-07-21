import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Lightbulb, Folder, X } from 'lucide-react';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { searchModalPop, overlayFade } from '../lib/animations';
import { SEARCH_DEBOUNCE_MS } from '../lib/constants';

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
        const res = await (window as any).api.searchAll(query);
        if (res.success) setResults(res.data || []);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, SEARCH_DEBOUNCE_MS);
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

  const typeVariant: Record<string, 'info' | 'success' | 'warning'> = {
    project: 'info',
    idea: 'success',
    script: 'warning',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={overlayFade.initial}
          animate={overlayFade.animate}
          exit={overlayFade.exit}
          transition={overlayFade.transition}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--overlay-bg)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '120px',
            backdropFilter: 'blur(var(--glass-blur))',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={searchModalPop.initial}
            animate={searchModalPop.animate}
            exit={searchModalPop.exit}
            transition={searchModalPop.transition}
            style={{
              width: 'min(640px, calc(100vw - 32px))',
              maxHeight: 'min(480px, calc(100vh - 160px))',
              background: 'var(--card-bg)',
              borderRadius: 'var(--radius-2xl)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <Search size={20} style={{ color: 'var(--primary)', opacity: 0.7, flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search everything... (Ctrl + K)"
                style={{
                  flex: 1,
                  fontSize: 'var(--text-xl)',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  background: 'transparent',
                  fontWeight: 'var(--weight-medium)',
                }}
              />
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)' }}>
              {loading && <LoadingSpinner />}

              {!loading && query && results.length === 0 && (
                <EmptyState icon={<Search size={24} />} title="No matches found" description={`No results for "${query}"`} />
              )}

              <AnimatePresence>
                {results.map((res, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={`${res.item_type}-${res.item_id}`}
                    onClick={() => onSelectResult(res.item_type, res.project_id, res.idea_id)}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                    className="search-item"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'var(--weight-bold)', color: 'var(--text-main)', fontSize: 'var(--text-md)' }}>
                        {res.title}
                      </div>
                      <Badge variant={typeVariant[res.item_type] || 'muted'} size="sm">
                        {getItemIcon(res.item_type)}
                        {res.item_type}
                      </Badge>
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {res.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
      <style>{`
        .search-item:hover { background: var(--card-bg-hover); transform: translateX(4px); }
      `}</style>
    </AnimatePresence>
  );
}

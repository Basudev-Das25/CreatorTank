import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PanelLeft, FileText, Download, Save, StickyNote } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { AUTOSAVE_DEBOUNCE_MS } from '../lib/constants';

interface ScriptEditorProps {
  ideaId: number;
  ideaTitle: string;
  onBack: () => void;
  isAssetPanelOpen: boolean;
  onToggleAssetPanel: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function ScriptEditor({
  ideaId,
  ideaTitle,
  onBack,
  isAssetPanelOpen,
  onToggleAssetPanel,
  isSidebarCollapsed,
  onToggleSidebar,
}: ScriptEditorProps) {
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [status, setStatus] = useState('Saved');
  const [showNotes, setShowNotes] = useState(false);

  const contentRef = useRef('');
  const notesRef = useRef('');
  const wordCountRef = useRef(0);

  useEffect(() => {
    contentRef.current = content;
    notesRef.current = notes;
    wordCountRef.current = wordCount;
  }, [content, notes, wordCount]);

  const performSave = async () => {
    setStatus('Saving...');
    try {
      await (window as any).api.saveScript(ideaId, contentRef.current, notesRef.current, wordCountRef.current);
      setStatus('Saved');
    } catch (e) {
      console.error(e);
      setStatus('Error saving');
    }
  };

  const handleExport = async (format: 'txt' | 'md') => {
    setStatus('Exporting...');
    const res = await (window as any).api.exportScript(ideaTitle, content, format);
    if (res.success) {
      setStatus('Exported!');
      setTimeout(() => setStatus('Saved'), 2000);
    } else if (!res.canceled) {
      setStatus('Export Error');
    } else {
      setStatus('Saved');
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!ideaId) return;
      setStatus('Loading...');
      try {
        const result = await (window as any).api.getScript(ideaId);
        if (mounted && result.success) {
          if (result.data) {
            setContent(result.data.content || '');
            setNotes(result.data.notes || '');
            setWordCount(result.data.word_count || 0);
          } else {
            setContent('');
            setNotes('');
            setWordCount(0);
          }
          setStatus('Saved');
        }
      } catch (e) {
        console.error(e);
        if (mounted) setStatus('Error loading');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ideaId]);

  useEffect(() => {
    if (!ideaId) return;
    const count = content
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    setWordCount(count);
    setStatus('Saving...');
    const timer = setTimeout(() => {
      performSave();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [content, notes, ideaId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        performSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ideaId]);

  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' }> = {
    Saved: { variant: 'success' },
    'Saving...': { variant: 'warning' },
    Loading: { variant: 'info' },
    Exported: { variant: 'success' },
    Exporting: { variant: 'warning' },
    'Error saving': { variant: 'danger' },
    'Error loading': { variant: 'danger' },
    'Export Error': { variant: 'danger' },
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg)',
        position: 'relative',
        flex: 1,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-6)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {isSidebarCollapsed && (
            <Button variant="ghost" size="sm" onClick={onToggleSidebar} icon={<PanelLeft size={18} />} title="Show Sidebar (Ctrl+B)" />
          )}
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft size={16} />} title="Back to Ideas" />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 'var(--weight-medium)' }}>
            {wordCount} words
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button
            variant={isAssetPanelOpen ? 'primary' : 'ghost'}
            size="sm"
            onClick={onToggleAssetPanel}
            icon={<FileText size={14} />}
            title={isAssetPanelOpen ? 'Hide Assets' : 'Show Assets'}
          >
            {isAssetPanelOpen ? 'Hide Assets' : 'Show Assets'}
          </Button>

          <Badge variant={statusConfig[status]?.variant || 'muted'} size="md">
            {status}
          </Badge>

          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '2px' }}>
            <Button variant="ghost" size="sm" onClick={() => handleExport('txt')} icon={<Download size={12} />}>
              TXT
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleExport('md')} icon={<Download size={12} />}>
              MD
            </Button>
          </div>

          <Button
            variant={showNotes ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            icon={<StickyNote size={14} />}
          >
            {showNotes ? 'Hide Notes' : 'Show Notes'}
          </Button>

          <Button variant="primary" size="sm" onClick={performSave} icon={<Save size={14} />}>
            Save
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--space-6)',
            overflowY: 'auto',
          }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your script..."
            style={{
              flex: 1,
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              border: 'none',
              outline: 'none',
              fontSize: 'var(--text-lg)',
              lineHeight: 'var(--leading-relaxed)',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-mono)',
              resize: 'none',
              background: 'transparent',
            }}
          />
        </div>

        {/* Notes Panel */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                borderLeft: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--sidebar-bg)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 'var(--weight-semibold)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-main)',
                }}
              >
                Script Notes
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add research, references, or ideas here..."
                style={{
                  flex: 1,
                  padding: 'var(--space-4)',
                  border: 'none',
                  outline: 'none',
                  fontSize: 'var(--text-base)',
                  background: 'transparent',
                  resize: 'none',
                  color: 'var(--text-main)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

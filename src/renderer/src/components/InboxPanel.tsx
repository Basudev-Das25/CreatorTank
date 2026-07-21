import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Plus, Trash2, ArrowRight, Edit3 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { GlassPanel } from './ui/GlassPanel';
import { EmptyState } from './ui/EmptyState';
import { SectionHeader } from './ui/SectionHeader';
import { listItem } from '../lib/animations';

interface InboxItem {
  id: number;
  title: string;
  note?: string;
  created_at: string;
}

interface InboxPanelProps {
  onConvertToIdea: (item: InboxItem) => void;
}

export function InboxPanel({ onConvertToIdea }: InboxPanelProps) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const loadItems = async () => {
    const res = await (window as any).api.getInboxItems();
    if (res.success) setItems(res.data || []);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await (window as any).api.createInboxItem(newTitle.trim(), newNote.trim() || undefined);
    setNewTitle('');
    setNewNote('');
    loadItems();
  };

  const handleDelete = async (id: number) => {
    await (window as any).api.deleteInboxItem(id);
    loadItems();
  };

  const handleUpdate = async (id: number, title: string) => {
    if (!title.trim()) return;
    await (window as any).api.updateInboxItem(id, { title: title.trim() });
    setEditingId(null);
    loadItems();
  };

  return (
    <div style={{ flex: 1, padding: 'var(--space-8)', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary)' }}><Inbox size={24} /></div>
            <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-main)' }}>
              Inbox
            </h2>
            <Badge variant="info" size="sm">{items.length}</Badge>
          </div>
        </div>

        {/* Quick Capture */}
        <GlassPanel padding="var(--space-5)" style={{ marginBottom: 'var(--space-6)' }}>
          <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Quick Capture</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCreate()}
              placeholder="What's on your mind?"
              prefix={<Plus size={14} />}
            />
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Optional note..."
            />
            <Button variant="primary" onClick={handleCreate} disabled={!newTitle.trim()} style={{ width: '100%' }}>
              Add to Inbox
            </Button>
          </div>
        </GlassPanel>

        {/* Items List */}
        {items.length === 0 ? (
          <EmptyState
            icon={<Inbox size={24} />}
            title="Inbox is empty"
            description="Capture quick ideas above or use Ctrl+Shift+Space"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={listItem.initial}
                  animate={listItem.animate}
                  exit={{ opacity: 0, x: -16 }}
                  whileHover={{ x: 4 }}
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--card-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                  className="inbox-item"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <div style={{ flex: 1 }}>
                      {editingId === item.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate(item.id, editTitle);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => handleUpdate(item.id, editTitle)}
                          autoFocus
                        />
                      ) : (
                        <div
                          style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-main)', marginBottom: 'var(--space-1)' }}
                          onDoubleClick={() => { setEditingId(item.id); setEditTitle(item.title); }}
                        >
                          {item.title}
                        </div>
                      )}
                      {item.note && (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                          {item.note}
                        </div>
                      )}
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                      <Button variant="ghost" size="sm" onClick={() => onConvertToIdea(item)} icon={<ArrowRight size={14} />} title="Convert to idea" />
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(item.id); setEditTitle(item.title); }} icon={<Edit3 size={14} />} title="Edit" />
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} icon={<Trash2 size={14} />} style={{ color: 'var(--danger)' }} title="Delete" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        .inbox-item:hover { border-color: var(--primary) !important; }
      `}</style>
    </div>
  );
}

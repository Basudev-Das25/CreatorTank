import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ProgressBar } from './ui/ProgressBar';
import { SectionHeader } from './ui/SectionHeader';
import { listItem } from '../lib/animations';

interface ChecklistItem {
  id: number;
  idea_id: number;
  label: string;
  position: number;
  is_checked: number;
}

interface ChecklistPanelProps {
  ideaId: number;
  onProgressChange?: (completed: number, total: number) => void;
}

export function ChecklistPanel({ ideaId, onProgressChange }: ChecklistPanelProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const loadItems = async () => {
    const res = await (window as any).api.getChecklistsByIdea(ideaId);
    if (res.success) {
      const sorted = (res.data || []).sort((a: ChecklistItem, b: ChecklistItem) => a.position - b.position);
      setItems(sorted);
    }
  };

  const initDefaults = async () => {
    await (window as any).api.initDefaultChecklists(ideaId);
    loadItems();
  };

  useEffect(() => {
    loadItems();
  }, [ideaId]);

  useEffect(() => {
    const completed = items.filter((i) => i.is_checked).length;
    onProgressChange?.(completed, items.length);
  }, [items]);

  const handleToggle = async (item: ChecklistItem) => {
    const newChecked = item.is_checked ? 0 : 1;
    await (window as any).api.updateChecklistItem(item.id, { is_checked: newChecked });
    setItems(items.map((i) => (i.id === item.id ? { ...i, is_checked: newChecked } : i)));
  };

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    const position = items.length;
    await (window as any).api.createChecklistItem(ideaId, newLabel.trim(), position);
    setNewLabel('');
    loadItems();
  };

  const handleDelete = async (id: number) => {
    await (window as any).api.deleteChecklistItem(id);
    loadItems();
  };

  const handleUpdateLabel = async (id: number, label: string) => {
    if (!label.trim()) return;
    await (window as any).api.updateChecklistItem(id, { label: label.trim() });
    setEditingId(null);
    loadItems();
  };

  const completed = items.filter((i) => i.is_checked).length;
  const total = items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Progress */}
      {total > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <SectionHeader>Progress</SectionHeader>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {completed}/{total} completed
            </span>
          </div>
          <ProgressBar value={percentage} size="md" showLabel />
        </div>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No checklist items yet</p>
          <Button variant="secondary" size="sm" onClick={initDefaults} style={{ marginTop: 'var(--space-3)' }}>
            Initialize Default Checklist
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={listItem.initial}
                animate={listItem.animate}
                exit={{ opacity: 0, x: -16 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: item.is_checked ? 'var(--primary-light)' : 'transparent',
                  transition: 'var(--transition-fast)',
                }}
                className="checklist-item"
              >
                <button
                  onClick={() => handleToggle(item)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${item.is_checked ? 'var(--primary)' : 'var(--border-strong)'}`,
                    background: item.is_checked ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {item.is_checked ? <Check size={12} color="var(--text-inverse)" /> : null}
                </button>

                {editingId === item.id ? (
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateLabel(item.id, editLabel);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleUpdateLabel(item.id, editLabel)}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      fontSize: 'var(--text-base)',
                      color: item.is_checked ? 'var(--text-muted)' : 'var(--text-main)',
                      textDecoration: item.is_checked ? 'line-through' : 'none',
                      cursor: 'pointer',
                    }}
                    onDoubleClick={() => { setEditingId(item.id); setEditLabel(item.label); }}
                  >
                    {item.label}
                  </span>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    padding: '4px',
                    color: 'var(--text-muted)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'var(--transition-fast)',
                  }}
                  className="delete-checklist-btn"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Item */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Add checklist item..."
          prefix={<Plus size={14} />}
          style={{ flex: 1 }}
        />
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={!newLabel.trim()}>
          Add
        </Button>
      </div>

      <style>{`
        .checklist-item:hover .delete-checklist-btn { opacity: 1; }
        .checklist-item:hover .delete-checklist-btn:hover { color: var(--danger); }
      `}</style>
    </div>
  );
}

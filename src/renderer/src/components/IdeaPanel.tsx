import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, PanelLeft, Trash2, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Badge } from './ui/Badge';
import { GlassPanel } from './ui/GlassPanel';
import { EmptyState } from './ui/EmptyState';
import { SectionHeader } from './ui/SectionHeader';
import { listItem } from '../lib/animations';

interface Idea {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  workflow_stage: string;
  scheduled_date?: string;
  output_path?: string;
}

interface IdeaPanelProps {
  project: any;
  onSelectIdea: (idea: any) => void;
  onScheduleIdea: (idea: any) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function IdeaPanel({
  project,
  onSelectIdea,
  onScheduleIdea,
  isSidebarCollapsed,
  onToggleSidebar,
}: IdeaPanelProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  const loadIdeas = async () => {
    const res = await (window as any).api.getIdeasByProject(project.id);
    if (res.success) setIdeas(res.data || []);
  };

  useEffect(() => {
    loadIdeas();
    const handleIdeaUpdate = (e: any) => {
      const { ideaId, ...updates } = e.detail;
      setIdeas((prev) => prev.map((i) => (i.id === ideaId ? { ...i, ...updates } : i)));
    };
    window.addEventListener('idea-updated', handleIdeaUpdate);
    return () => window.removeEventListener('idea-updated', handleIdeaUpdate);
  }, [project.id]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const res = await (window as any).api.createIdea(project.id, newTitle, newDesc, newPriority);
    if (res.success) {
      setNewTitle('');
      setNewDesc('');
      loadIdeas();
    }
  };

  const handleUpdate = async (id: number, field: string, value: any) => {
    const res = await (window as any).api.updateIdea(id, { [field]: value });
    if (res.success) {
      setIdeas(ideas.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this idea?')) {
      const res = await (window as any).api.deleteIdea(id);
      if (res.success) loadIdeas();
    }
  };

  const handlePickOutputPath = async (id: number) => {
    const res = await (window as any).api.pickOutputPath();
    if (res.success && res.path) {
      handleUpdate(id, 'output_path', res.path);
    }
  };

  const filteredIdeas = ideas.filter(
    (i) =>
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const priorityConfig: Record<string, { bg: string; color: string; label: string }> = {
    high: { bg: 'var(--danger-bg)', color: 'var(--danger-text)', label: 'High' },
    medium: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', label: 'Med' },
    low: { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', label: 'Low' },
  };

  return (
    <div style={{ flex: 1, padding: 'var(--space-8)', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {isSidebarCollapsed && (
              <Button variant="ghost" size="sm" onClick={onToggleSidebar} icon={<PanelLeft size={18} />} title="Show Sidebar (Ctrl+B)" />
            )}
            <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-2xl)' }}>
              Project Ideas
            </h2>
          </div>
          <div style={{ width: '300px' }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ideas..."
              prefix={<Search size={14} />}
            />
          </div>
        </div>

        {/* New Idea Form */}
        <GlassPanel padding="var(--space-5)" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Quick idea title..."
              style={{ flex: 2 }}
            />
            <Select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ flex: 0.5 }}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </Select>
            <Button variant="primary" onClick={handleCreate} style={{ flex: 0.5 }}>
              Add Idea
            </Button>
          </div>
        </GlassPanel>

        {/* Ideas Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--space-5)' }}>
          {filteredIdeas.length === 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <EmptyState
                icon={<Search size={24} />}
                title={searchTerm ? 'No matching ideas' : 'No ideas yet'}
                description={searchTerm ? `No ideas matching "${searchTerm}"` : 'Start capturing ideas above'}
              />
            </div>
          )}

          <AnimatePresence>
            {filteredIdeas.map((idea) => (
              <motion.div
                key={idea.id}
                layout
                initial={listItem.initial}
                animate={listItem.animate}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  background: 'var(--card-bg)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <input
                    value={idea.title}
                    onChange={(e) => handleUpdate(idea.id, 'title', e.target.value)}
                    style={{
                      fontWeight: 'var(--weight-bold)',
                      fontSize: 'var(--text-lg)',
                      border: 'none',
                      flex: 1,
                      background: 'transparent',
                      outline: 'none',
                      color: 'var(--text-main)',
                      padding: 0,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <Button variant="primary" size="sm" onClick={() => onSelectIdea(idea)}>
                      Open
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(idea.id)}
                      icon={<Trash2 size={14} />}
                      style={{ color: 'var(--danger)' }}
                    />
                  </div>
                </div>

                {/* Description */}
                <textarea
                  value={idea.description || ''}
                  onChange={(e) => handleUpdate(idea.id, 'description', e.target.value)}
                  placeholder="Add description..."
                  style={{
                    border: 'none',
                    fontSize: 'var(--text-base)',
                    resize: 'none',
                    background: 'transparent',
                    outline: 'none',
                    color: 'var(--text-secondary)',
                    height: '60px',
                    fontFamily: 'inherit',
                    lineHeight: 'var(--leading-relaxed)',
                  }}
                />

                {/* Final Output */}
                <div
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <SectionHeader>Final Output</SectionHeader>
                    {idea.output_path && (
                      <Button variant="ghost" size="sm" onClick={() => handleUpdate(idea.id, 'output_path', null)} style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)' }}>
                        Clear
                      </Button>
                    )}
                  </div>
                  {idea.output_path ? (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <div
                        style={{
                          flex: 1,
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg)',
                          padding: 'var(--space-2) var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {idea.output_path.split(/[\\/]/).pop()}
                      </div>
                      <Button variant="primary" size="sm" icon={<ExternalLink size={12} />}>
                        Launch
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePickOutputPath(idea.id)}
                      style={{ width: '100%', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
                    >
                      + Link Result (Video, Image, etc.)
                    </Button>
                  )}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <select
                      value={idea.workflow_stage || 'idea'}
                      onChange={(e) => handleUpdate(idea.id, 'workflow_stage', e.target.value)}
                      style={{
                        fontSize: 'var(--text-xs)',
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--primary)',
                        fontWeight: 'var(--weight-semibold)',
                      }}
                    >
                      <option value="idea">Idea</option>
                      <option value="writing">Writing</option>
                      <option value="recording">Recording</option>
                      <option value="editing">Editing</option>
                      <option value="ready">Ready</option>
                      <option value="published">Published</option>
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => onScheduleIdea(idea)} icon={<Calendar size={12} />}>
                      {idea.scheduled_date || 'Schedule'}
                    </Button>
                  </div>
                  <Badge
                    variant={idea.priority === 'high' ? 'danger' : idea.priority === 'medium' ? 'warning' : 'muted'}
                    size="sm"
                  >
                    {priorityConfig[idea.priority]?.label || idea.priority}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

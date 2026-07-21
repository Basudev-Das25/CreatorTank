import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, PanelLeft, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { listItem } from '../lib/animations';

interface Idea {
  id: number;
  project_id: number;
  title: string;
  description: string;
  workflow_stage: string;
  priority: string;
  project_name?: string;
  scheduled_date?: string;
}

const STAGES = [
  { id: 'idea', label: 'Idea' },
  { id: 'writing', label: 'Writing' },
  { id: 'recording', label: 'Recording' },
  { id: 'editing', label: 'Editing' },
  { id: 'ready', label: 'Ready' },
  { id: 'published', label: 'Published' },
];

interface WorkflowBoardProps {
  onOpenIdea: (idea: any) => void;
  onScheduleItem: (item: any) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function WorkflowBoard({ onOpenIdea, onScheduleItem, isSidebarCollapsed, onToggleSidebar }: WorkflowBoardProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllIdeas = async () => {
    setLoading(true);
    const res = await (window as any).api.getScheduledIdeas();
    if (res.success) {
      setIdeas((res.data || []).filter((item: any) => item.type === 'idea'));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllIdeas();
  }, []);

  const moveStage = async (ideaId: number, currentStage: string, direction: 'left' | 'right') => {
    const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
    const nextIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < STAGES.length) {
      const nextStage = STAGES[nextIndex].id;
      const res = await (window as any).api.updateIdea(ideaId, { workflow_stage: nextStage });
      if (res.success) loadAllIdeas();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div
        style={{
          padding: 'var(--space-5) var(--space-8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--sidebar-bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {isSidebarCollapsed && (
            <Button variant="ghost" size="sm" onClick={onToggleSidebar} icon={<PanelLeft size={18} />} title="Show Sidebar (Ctrl+B)" />
          )}
          <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-main)' }}>
            Workflow Board
          </h2>
        </div>
        <Button variant="primary" size="sm" onClick={loadAllIdeas} icon={<RefreshCw size={14} />}>
          Refresh
        </Button>
      </div>

      {/* Board */}
      <div style={{ display: 'flex', gap: 'var(--space-5)', padding: 'var(--space-6)', overflowX: 'auto', flex: 1, alignItems: 'flex-start' }}>
        {STAGES.map((stage) => {
          const stageIdeas = ideas.filter((i) => (i.workflow_stage || 'idea') === stage.id);
          return (
            <div
              key={stage.id}
              style={{
                width: '280px',
                minWidth: '280px',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(var(--glass-blur))',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
                border: '1px solid var(--glass-border)',
                transition: 'var(--transition-fast)',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: 'var(--space-4)',
                  fontWeight: 'var(--weight-bold)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-main)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid var(--border)',
                }}
              >
                {stage.label}
                <Badge variant="muted" size="sm">{stageIdeas.length}</Badge>
              </div>

              {/* Column Content */}
              <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', overflowY: 'auto', flex: 1 }}>
                <AnimatePresence>
                  {stageIdeas.map((idea) => (
                    <motion.div
                      key={idea.id}
                      layout
                      initial={listItem.initial}
                      animate={listItem.animate}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
                      onClick={() => onOpenIdea(idea)}
                      style={{
                        background: 'var(--card-bg)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--text-main)', marginBottom: 'var(--space-3)' }}>
                        {idea.title}
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStage(idea.id, idea.workflow_stage || 'idea', 'left');
                          }}
                          disabled={STAGES.findIndex((s) => s.id === (idea.workflow_stage || 'idea')) === 0}
                          icon={<ChevronLeft size={14} />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onScheduleItem(idea);
                          }}
                          icon={<Calendar size={12} />}
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          {idea.scheduled_date || 'Schedule'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStage(idea.id, idea.workflow_stage || 'idea', 'right');
                          }}
                          disabled={STAGES.findIndex((s) => s.id === (idea.workflow_stage || 'idea')) === STAGES.length - 1}
                          icon={<ChevronRight size={14} />}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

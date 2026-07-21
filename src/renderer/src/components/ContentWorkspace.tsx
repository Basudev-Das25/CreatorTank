import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, FolderOpen, Link, CheckSquare, StickyNote,
  Settings, BarChart3, Calendar,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { GlassPanel } from './ui/GlassPanel';
import { SectionHeader } from './ui/SectionHeader';
import { ProgressBar } from './ui/ProgressBar';
import { ScriptEditor } from './ScriptEditor';
import { AssetPanel } from './AssetPanel';
import { ChecklistPanel } from './ChecklistPanel';

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

interface ContentWorkspaceProps {
  idea: Idea;
  onBack: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

type TabId = 'overview' | 'script' | 'assets' | 'research' | 'links' | 'checklist' | 'publishing';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
  { id: 'script', label: 'Script', icon: <FileText size={14} /> },
  { id: 'assets', label: 'Assets', icon: <FolderOpen size={14} /> },
  { id: 'research', label: 'Research', icon: <StickyNote size={14} /> },
  { id: 'links', label: 'Links', icon: <Link size={14} /> },
  { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={14} /> },
  { id: 'publishing', label: 'Publishing', icon: <Settings size={14} /> },
];

export function ContentWorkspace({ idea, onBack, isSidebarCollapsed, onToggleSidebar }: ContentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [checklistProgress, setChecklistProgress] = useState({ completed: 0, total: 0 });
  const [researchContent, setResearchContent] = useState('');
  const [linksContent, setLinksContent] = useState('');
  const [publishingContent, setPublishingContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load workspace notes
  const loadNotes = async (tabType: string) => {
    const res = await (window as any).api.getWorkspaceNotes(idea.id, tabType);
    if (res.success && res.data) {
      return res.data.content || '';
    }
    return '';
  };

  useEffect(() => {
    const loadAllNotes = async () => {
      setResearchContent(await loadNotes('research'));
      setLinksContent(await loadNotes('links'));
      setPublishingContent(await loadNotes('publishing'));
    };
    loadAllNotes();
  }, [idea.id]);

  // Auto-save notes
  const saveNotes = async (tabType: string, content: string) => {
    setIsSaving(true);
    await (window as any).api.saveWorkspaceNotes(idea.id, tabType, content);
    setIsSaving(false);
  };

  const handleResearchChange = (value: string) => {
    setResearchContent(value);
    // Debounce save
    setTimeout(() => saveNotes('research', value), 1000);
  };

  const handleLinksChange = (value: string) => {
    setLinksContent(value);
    setTimeout(() => saveNotes('links', value), 1000);
  };

  const handlePublishingChange = (value: string) => {
    setPublishingContent(value);
    setTimeout(() => saveNotes('publishing', value), 1000);
  };

  const stageColors: Record<string, string> = {
    idea: 'muted',
    writing: 'info',
    recording: 'warning',
    editing: 'primary',
    ready: 'success',
    published: 'success',
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ padding: 'var(--space-6)', maxWidth: '800px' }}>
            <GlassPanel padding="var(--space-6)">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-main)' }}>
                    {idea.title}
                  </h2>
                  {idea.description && (
                    <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
                      {idea.description}
                    </p>
                  )}
                </div>
                <Badge variant={(stageColors[idea.workflow_stage] as any) || 'muted'} size="md">
                  {idea.workflow_stage}
                </Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div>
                  <SectionHeader>Priority</SectionHeader>
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <Badge variant={idea.priority === 'high' ? 'danger' : idea.priority === 'medium' ? 'warning' : 'muted'}>
                      {idea.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <SectionHeader>Scheduled</SectionHeader>
                  <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Calendar size={14} />
                    {idea.scheduled_date || 'Not scheduled'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <SectionHeader>Completion</SectionHeader>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <ProgressBar
                    value={checklistProgress.total > 0 ? (checklistProgress.completed / checklistProgress.total) * 100 : 0}
                    size="md"
                    showLabel
                  />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                    {checklistProgress.completed}/{checklistProgress.total} checklist items completed
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        );

      case 'script':
        return (
          <ScriptEditor
            ideaId={idea.id}
            ideaTitle={idea.title}
            onBack={onBack}
            isAssetPanelOpen={false}
            onToggleAssetPanel={() => {}}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={onToggleSidebar}
          />
        );

      case 'assets':
        return <AssetPanel ideaId={idea.id} />;

      case 'research':
        return (
          <div style={{ padding: 'var(--space-6)', maxWidth: '800px', height: '100%' }}>
            <SectionHeader style={{ marginBottom: 'var(--space-4)' }}>Research Notes</SectionHeader>
            <textarea
              value={researchContent}
              onChange={(e) => handleResearchChange(e.target.value)}
              placeholder="Add research notes, references, and ideas..."
              style={{
                width: '100%',
                height: 'calc(100% - 40px)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-main)',
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
                resize: 'none',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        );

      case 'links':
        return (
          <div style={{ padding: 'var(--space-6)', maxWidth: '800px', height: '100%' }}>
            <SectionHeader style={{ marginBottom: 'var(--space-4)' }}>Reference Links</SectionHeader>
            <textarea
              value={linksContent}
              onChange={(e) => handleLinksChange(e.target.value)}
              placeholder="Store reference URLs, articles, videos, documentation..."
              style={{
                width: '100%',
                height: 'calc(100% - 40px)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-main)',
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
                resize: 'none',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        );

      case 'checklist':
        return (
          <div style={{ padding: 'var(--space-6)', maxWidth: '800px' }}>
            <ChecklistPanel
              ideaId={idea.id}
              onProgressChange={(completed, total) => setChecklistProgress({ completed, total })}
            />
          </div>
        );

      case 'publishing':
        return (
          <div style={{ padding: 'var(--space-6)', maxWidth: '800px', height: '100%' }}>
            <SectionHeader style={{ marginBottom: 'var(--space-4)' }}>Publishing Notes</SectionHeader>
            <textarea
              value={publishingContent}
              onChange={(e) => handlePublishingChange(e.target.value)}
              placeholder="YouTube title ideas, descriptions, hashtags, keywords, CTA ideas, sponsor notes..."
              style={{
                width: '100%',
                height: 'calc(100% - 40px)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-main)',
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
                resize: 'none',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          gap: 'var(--space-3)',
        }}
      >
        <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft size={16} />} title="Back to ideas" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {idea.title}
          </div>
        </div>
        {isSaving && (
          <Badge variant="warning" size="sm">Saving...</Badge>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-4)',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              fontSize: 'var(--text-sm)',
              border: 'none',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

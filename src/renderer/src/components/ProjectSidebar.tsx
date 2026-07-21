import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, BarChart3, Plus, Search,
  Trash2, Heart, Settings, Folder, Youtube, Instagram,
  Mic, FileText, PanelLeftClose, Home, Inbox,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { GlassPanel } from './ui/GlassPanel';
import { SectionHeader } from './ui/SectionHeader';
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from '../lib/constants';
import { listItem } from '../lib/animations';

interface Project {
  id: number;
  name: string;
  platform: string;
  idea_count?: number;
  last_activity?: string;
}

interface ProjectSidebarProps {
  onSelectProject: (project: Project | null) => void;
  selectedProjectId?: number;
  onOpenTools: () => void;
  currentView: 'dashboard' | 'project' | 'inbox' | 'calendar' | 'workflow';
  onViewChange: (view: 'dashboard' | 'project' | 'inbox' | 'calendar' | 'workflow') => void;
  onScheduleItem: (item: any) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  YouTube: <Youtube size={14} />,
  Instagram: <Instagram size={14} />,
  Podcast: <Mic size={14} />,
  Blog: <FileText size={14} />,
  Custom: <Folder size={14} />,
};

export function ProjectSidebar({
  onSelectProject,
  selectedProjectId,
  onOpenTools,
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  onConfirmDelete,
}: ProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPlatform, setNewProjectPlatform] = useState('YouTube');
  const [showDonateStatus, setShowDonateStatus] = useState(false);

  const loadProjects = async () => {
    const res = await (window as any).api.getAllProjects();
    if (res.success) {
      setProjects(res.data || []);
    }
  };

  useEffect(() => {
    loadProjects();

    // Auto-collapse sidebar on narrow windows
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        onToggleCollapse();
      }
    };
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    const res = await (window as any).api.createProject(newProjectName, newProjectPlatform);
    if (res.success) {
      setNewProjectName('');
      loadProjects();
      if (res.id) {
        onSelectProject({ id: res.id, name: newProjectName, platform: newProjectPlatform });
        onViewChange('project');
      }
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirmDelete(
      'Delete Project',
      'Are you sure you want to delete this project and all its associated ideas? This action cannot be undone.',
      async () => {
        await (window as any).api.deleteProject(id);
        if (selectedProjectId === id) onSelectProject(null);
        loadProjects();
      }
    );
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'dashboard' as const, icon: <Home size={18} />, label: 'Dashboard' },
    { id: 'inbox' as const, icon: <Inbox size={18} />, label: 'Inbox' },
    { id: 'project' as const, icon: <Folder size={18} />, label: 'Projects' },
    { id: 'calendar' as const, icon: <Calendar size={18} />, label: 'Calendar' },
    { id: 'workflow' as const, icon: <BarChart3 size={18} />, label: 'Workflow' },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      style={{
        height: '100%',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isCollapsed ? 'var(--space-4) var(--space-2)' : 'var(--space-5) var(--space-5) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'stretch',
          position: 'relative',
        }}
      >
        {/* Collapsed state: Logo centered, toggle button top-right */}
        {isCollapsed && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-inverse)',
              marginBottom: 'var(--space-5)',
            }}
          >
            <LayoutDashboard size={20} />
          </div>
        )}

        {/* Expanded state: Logo + title + toggle */}
        {!isCollapsed && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-4)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-inverse)',
                }}
              >
                <LayoutDashboard size={18} />
              </div>
              <span
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--weight-extrabold)',
                  color: 'var(--primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                CreatorTank
              </span>
            </motion.div>
          </div>
        )}

        {/* Toggle button - only show when expanded */}
        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              transition: 'var(--transition-fast)',
              alignSelf: 'flex-end',
            }}
            title="Collapse (Ctrl+B)"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div
        style={{
          padding: isCollapsed ? '0 var(--space-3)' : '0 var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          alignItems: isCollapsed ? 'center' : 'stretch',
        }}
      >
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ backgroundColor: 'var(--primary-light)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange(item.id)}
            style={{
              width: '100%',
              padding: isCollapsed ? 'var(--space-3)' : 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: currentView === item.id ? 'var(--primary-light)' : 'transparent',
              color: currentView === item.id ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: currentView === item.id ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              fontSize: 'var(--text-base)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? '0' : 'var(--space-3)',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              transition: 'var(--transition-fast)',
              position: 'relative',
            }}
            title={item.label}
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
            {currentView === item.id && !isCollapsed && (
              <motion.div
                layoutId="activeNav"
                style={{
                  position: 'absolute',
                  left: 0,
                  width: '3px',
                  height: '60%',
                  background: 'var(--primary)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'var(--border)',
          margin: isCollapsed ? 'var(--space-3) var(--space-3)' : 'var(--space-3) var(--space-4)',
        }}
      />

      {/* Project List */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-3) var(--space-6)' }}>
            {/* New Project Form */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <GlassPanel padding="var(--space-3)">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Project name..."
                  suffix={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCreate}
                      icon={<Plus size={16} />}
                      style={{ padding: '4px', color: 'var(--primary)' }}
                    />
                  }
                />
                <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                  {['YouTube', 'Instagram', 'Podcast', 'Blog', 'Custom'].map((p) => (
                    <Button
                      key={p}
                      variant={newProjectPlatform === p ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setNewProjectPlatform(p)}
                      icon={PLATFORM_ICONS[p]}
                      style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </GlassPanel>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                prefix={<Search size={14} />}
              />
            </div>

            {/* Label */}
            <div style={{ marginBottom: 'var(--space-2)', padding: '0 var(--space-1)' }}>
              <SectionHeader>Projects</SectionHeader>
            </div>

            {/* Projects */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <AnimatePresence>
                {filteredProjects.map((p) => (
                  <motion.div
                    layout
                    key={p.id}
                    initial={listItem.initial}
                    animate={listItem.animate}
                    exit={{ opacity: 0, x: -16 }}
                    whileHover={{ backgroundColor: 'var(--card-bg-hover)' }}
                    onClick={() => {
                      onSelectProject(p);
                      onViewChange('project');
                    }}
                    className="sidebar-item"
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      cursor: 'pointer',
                      background: selectedProjectId === p.id ? 'var(--primary-light)' : 'transparent',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: selectedProjectId === p.id ? '1px solid var(--primary-light)' : '1px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        overflow: 'hidden',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div
                        style={{
                          color: selectedProjectId === p.id ? 'var(--primary)' : 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        {PLATFORM_ICONS[p.platform] || PLATFORM_ICONS.Custom}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontWeight: 'var(--weight-semibold)',
                            color: selectedProjectId === p.id ? 'var(--primary)' : 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            fontSize: 'var(--text-base)',
                          }}
                        >
                          {p.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {p.idea_count || 0} ideas
                        </div>
                      </div>
                    </div>
                    <div className="item-actions" style={{ display: 'flex', alignItems: 'center', opacity: 0 }}>
                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        style={{
                          padding: '4px',
                          color: 'var(--danger)',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: isCollapsed ? 'var(--space-3)' : 'var(--space-4)',
          display: 'flex',
          flexDirection: isCollapsed ? 'column' : 'row',
          gap: 'var(--space-2)',
          borderTop: '1px solid var(--border)',
          background: 'var(--sidebar-bg)',
          alignItems: isCollapsed ? 'center' : 'stretch',
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowDonateStatus(true);
            setTimeout(() => setShowDonateStatus(false), 3000);
          }}
          icon={<Heart size={16} fill={showDonateStatus ? 'var(--support)' : 'none'} />}
          style={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            color: 'var(--support)',
            background: 'var(--support-bg)',
            border: '1px solid rgba(244, 114, 182, 0.1)',
            width: isCollapsed ? '36px' : '100%',
          }}
        >
          {!isCollapsed && 'Support'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenTools}
          icon={<Settings size={16} />}
          style={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            color: 'var(--text-muted)',
            width: isCollapsed ? '36px' : '100%',
          }}
        >
          {!isCollapsed && 'Settings'}
        </Button>
      </div>

      <style>{`
        .sidebar-item:hover .item-actions { opacity: 1; }
        .sidebar-item:hover { background: var(--card-bg-hover) !important; }
      `}</style>
    </motion.div>
  );
}

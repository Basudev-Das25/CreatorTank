import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Folder, Youtube, Instagram, Mic, FileText, Calendar, PanelLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { GlassPanel } from './ui/GlassPanel';
import { EmptyState } from './ui/EmptyState';
import { SectionHeader } from './ui/SectionHeader';
import { listItem } from '../lib/animations';

interface Project {
  id: number;
  name: string;
  platform: string;
  idea_count?: number;
  last_activity?: string;
  scheduled_date?: string;
}

interface ProjectListProps {
  onSelectProject: (project: Project) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  YouTube: <Youtube size={16} />,
  Instagram: <Instagram size={16} />,
  Podcast: <Mic size={16} />,
  Blog: <FileText size={16} />,
  Custom: <Folder size={16} />,
};

const PLATFORMS = ['YouTube', 'Instagram', 'Podcast', 'Blog', 'Custom'];

export function ProjectList({ onSelectProject, onConfirmDelete, isSidebarCollapsed, onToggleSidebar }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPlatform, setNewProjectPlatform] = useState('YouTube');
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    setLoading(true);
    const res = await (window as any).api.getAllProjects();
    if (res.success) setProjects(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    const res = await (window as any).api.createProject(newProjectName, newProjectPlatform);
    if (res.success) {
      setNewProjectName('');
      setNewProjectPlatform('YouTube');
      loadProjects();
      if (res.id) {
        onSelectProject({ id: res.id, name: newProjectName, platform: newProjectPlatform, idea_count: 0 });
      }
    }
  };

  const handleDelete = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirmDelete(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This will remove all ideas, scripts, and assets.`,
      async () => {
        await (window as any).api.deleteProject(project.id);
        loadProjects();
      }
    );
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ flex: 1, padding: 'var(--space-8)', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {isSidebarCollapsed && (
              <Button variant="ghost" size="sm" onClick={onToggleSidebar} icon={<PanelLeft size={18} />} />
            )}
            <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-main)' }}>
              Projects
            </h2>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{projects.length} total</span>
          </div>
        </div>

        {/* New Project Form */}
        <GlassPanel padding="var(--space-5)" style={{ marginBottom: 'var(--space-6)' }}>
          <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Create New Project</SectionHeader>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Project name..."
              prefix={<Plus size={14} />}
              style={{ flex: '1 1 250px', minWidth: 0 }}
            />
            <div style={{ display: 'flex', gap: 'var(--space-1)', flex: '1 1 300px', flexWrap: 'wrap' }}>
              {PLATFORMS.map((p) => (
                <Button
                  key={p}
                  variant={newProjectPlatform === p ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setNewProjectPlatform(p)}
                  icon={PLATFORM_ICONS[p]}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button variant="primary" onClick={handleCreate} disabled={!newProjectName.trim()} icon={<Plus size={16} />}>
              Create
            </Button>
          </div>
        </GlassPanel>

        {/* Search */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
            prefix={<Search size={14} />}
          />
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={<Folder size={24} />}
            title={searchTerm ? 'No matching projects' : 'No projects yet'}
            description={searchTerm ? `No projects matching "${searchTerm}"` : 'Create your first project above'}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 'var(--space-4)' }}>
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={listItem.initial}
                  animate={listItem.animate}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                  onClick={() => onSelectProject(project)}
                  style={{
                    padding: 'var(--space-5)',
                    background: 'var(--card-bg)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                  className="project-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                      }}>
                        {PLATFORM_ICONS[project.platform] || PLATFORM_ICONS.Custom}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-md)', color: 'var(--text-main)' }}>
                          {project.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {project.platform}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(project, e)}
                      className="delete-project-btn"
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {project.idea_count || 0} ideas
                    </span>
                    {project.last_activity && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={10} />
                        {new Date(project.last_activity).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        .project-card:hover .delete-project-btn { opacity: 1; }
        .project-card:hover .delete-project-btn:hover { color: var(--danger); }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket, Folder, Calendar, FileText, Clock, AlertTriangle,
  PenTool, CheckCircle, ArrowRight,
} from 'lucide-react';
import { GlassPanel } from './ui/GlassPanel';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { SectionHeader } from './ui/SectionHeader';
import { EmptyState } from './ui/EmptyState';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface DashboardProps {
  onNavigate: (view: 'project' | 'calendar' | 'workflow' | 'inbox') => void;
  onSelectProject: (project: any) => void;
  onSelectIdea: (idea: any) => void;
}

export function Dashboard({ onNavigate, onSelectProject, onSelectIdea }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    const res = await (window as any).api.getDashboardStats();
    if (res.success) setStats(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <EmptyState icon={<Rocket size={24} />} title="Welcome to CreatorTank" />;

  const stageColors: Record<string, string> = {
    writing: 'info',
    recording: 'warning',
    editing: 'primary',
    ready: 'success',
  };

  return (
    <div style={{ flex: 1, padding: 'var(--space-8)', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 'var(--space-8)' }}
        >
          <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-extrabold)', color: 'var(--text-main)' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋
          </h1>
          <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-md)', color: 'var(--text-muted)' }}>
            Here's what's happening with your content
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {[
            { label: 'Active Projects', value: stats.activeProjects, icon: <Folder size={18} />, color: 'var(--primary)' },
            { label: 'Ideas This Week', value: stats.ideasThisWeek, icon: <Rocket size={18} />, color: 'var(--accent)' },
            { label: 'Scripts Written', value: stats.scriptsWritten, icon: <PenTool size={18} />, color: 'var(--warning)' },
            { label: 'Words Written', value: stats.wordsWritten.toLocaleString(), icon: <FileText size={18} />, color: 'var(--success)' },
            { label: 'Published', value: stats.publishedCount, icon: <CheckCircle size={18} />, color: 'var(--moss-400)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassPanel padding="var(--space-5)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div style={{ color: stat.color }}>{stat.icon}</div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-extrabold)', color: 'var(--text-main)' }}>
                  {stat.value}
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))', gap: 'var(--space-4)' }}>
          {/* Today's Focus */}
          <GlassPanel padding="var(--space-5)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <SectionHeader>Today's Focus</SectionHeader>
              <Badge variant="info" size="sm">{stats.todayItems.length + stats.inProgressItems.length + stats.overdueItems.length}</Badge>
            </div>
            {stats.overdueItems.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <AlertTriangle size={12} /> Overdue
                </div>
                {stats.overdueItems.map((item: any) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 4 }}
                    onClick={() => onSelectIdea(item)}
                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}
                    className="dashboard-item"
                  >
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>{item.title}</span>
                    <Badge variant="danger" size="sm">{item.workflow_stage}</Badge>
                  </motion.div>
                ))}
              </div>
            )}
            {stats.inProgressItems.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Clock size={12} /> In Progress
                </div>
                {stats.inProgressItems.map((item: any) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 4 }}
                    onClick={() => onSelectIdea(item)}
                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}
                    className="dashboard-item"
                  >
                    <div>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>{item.title}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>{item.project_name}</span>
                    </div>
                    <Badge variant={(stageColors[item.workflow_stage] as any) || 'muted'} size="sm">{item.workflow_stage}</Badge>
                  </motion.div>
                ))}
              </div>
            )}
            {stats.todayItems.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Calendar size={12} /> Scheduled Today
                </div>
                {stats.todayItems.map((item: any) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 4 }}
                    onClick={() => onSelectIdea(item)}
                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}
                    className="dashboard-item"
                  >
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>{item.title}</span>
                    {item.scheduled_time && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.scheduled_time}</span>}
                  </motion.div>
                ))}
              </div>
            )}
            {stats.overdueItems.length === 0 && stats.inProgressItems.length === 0 && stats.todayItems.length === 0 && (
              <EmptyState icon={<CheckCircle size={20} />} title="All caught up!" description="No urgent items for today" />
            )}
          </GlassPanel>

          {/* Upcoming Schedule */}
          <GlassPanel padding="var(--space-5)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <SectionHeader>Upcoming Schedule</SectionHeader>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')} icon={<ArrowRight size={14} />}>
                View All
              </Button>
            </div>
            {stats.upcomingSchedule.length > 0 ? (
              stats.upcomingSchedule.map((item: any) => (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  whileHover={{ x: 4 }}
                  onClick={() => item.type === 'idea' ? onSelectIdea(item) : onSelectProject(item)}
                  style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}
                  className="dashboard-item"
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)', fontWeight: 'var(--weight-medium)' }}>{item.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.project_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{item.scheduled_date}</div>
                    {item.scheduled_time && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.scheduled_time}</div>}
                  </div>
                </motion.div>
              ))
            ) : (
              <EmptyState icon={<Calendar size={20} />} title="No upcoming schedule" description="Schedule ideas to see them here" />
            )}
          </GlassPanel>

          {/* Recent Projects */}
          <GlassPanel padding="var(--space-5)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <SectionHeader>Recent Projects</SectionHeader>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('project')} icon={<ArrowRight size={14} />}>
                View All
              </Button>
            </div>
            {stats.recentProjects.length > 0 ? (
              stats.recentProjects.map((project: any) => (
                <motion.div
                  key={project.id}
                  whileHover={{ x: 4 }}
                  onClick={() => onSelectProject(project)}
                  style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}
                  className="dashboard-item"
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)', fontWeight: 'var(--weight-medium)' }}>{project.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{project.platform}</div>
                  </div>
                  <Badge variant="muted" size="sm">{project.idea_count || 0} ideas</Badge>
                </motion.div>
              ))
            ) : (
              <EmptyState icon={<Folder size={20} />} title="No projects yet" description="Create your first project" />
            )}
          </GlassPanel>

          {/* Recently Edited */}
          <GlassPanel padding="var(--space-5)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <SectionHeader>Recently Edited</SectionHeader>
            </div>
            {stats.recentlyEdited.length > 0 ? (
              stats.recentlyEdited.map((item: any) => (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  whileHover={{ x: 4 }}
                  onClick={() => onSelectIdea(item)}
                  style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}
                  className="dashboard-item"
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)', fontWeight: 'var(--weight-medium)' }}>{item.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.project_name}</div>
                  </div>
                  <Badge variant={item.type === 'script' ? 'info' : 'muted'} size="sm">{item.type}</Badge>
                </motion.div>
              ))
            ) : (
              <EmptyState icon={<FileText size={20} />} title="No recent edits" description="Start editing to see activity" />
            )}
          </GlassPanel>
        </div>
      </div>

      <style>{`
        .dashboard-item:hover { background: var(--card-bg-hover); }
      `}</style>
    </div>
  );
}

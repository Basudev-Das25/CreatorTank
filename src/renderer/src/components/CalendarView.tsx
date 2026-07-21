import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, PanelLeft, Folder } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface Idea {
  id: number;
  project_id: number;
  title: string;
  scheduled_date: string;
  scheduled_time?: string;
  workflow_stage?: string;
  project_name?: string;
  type?: 'idea' | 'project';
}

interface CalendarViewProps {
  onOpenIdea: (idea: any) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function CalendarView({ onOpenIdea, isSidebarCollapsed, onToggleSidebar }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIdeas = async () => {
    setLoading(true);
    const res = await (window as any).api.getScheduledIdeas();
    if (res.success) setIdeas(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  const getIdeasForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return ideas.filter((i) => i.scheduled_date === dateStr);
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
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
          {isSidebarCollapsed && (
            <Button variant="ghost" size="sm" onClick={onToggleSidebar} icon={<PanelLeft size={18} />} title="Show Sidebar (Ctrl+B)" />
          )}
          <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-main)' }}>
            {monthName} {year}
          </h2>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} icon={<ChevronLeft size={16} />} />
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} style={{ padding: '6px 12px' }}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} icon={<ChevronRight size={16} />} />
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={loadIdeas} icon={<RefreshCw size={14} />}>
          Refresh
        </Button>
      </div>

      {/* Days Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            style={{
              padding: 'var(--space-3)',
              textAlign: 'center',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflowY: 'auto' }}>
        <AnimatePresence>
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  style={{
                    borderRight: '1px solid var(--border-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: 'var(--space-2)',
                    minHeight: '120px',
                    background: 'var(--sidebar-bg)',
                    opacity: 0.3,
                  }}
                />
              );
            }

            const dayIdeas = getIdeasForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.01 }}
                style={{
                  borderRight: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: 'var(--space-2)',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  background: isToday ? 'var(--primary-light)' : 'transparent',
                  transition: 'var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-bold)',
                    marginBottom: 'var(--space-2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: isToday ? 'var(--primary)' : 'var(--text-secondary)' }}>{day}</span>
                  {isToday && <Badge variant="primary" size="sm">Today</Badge>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  {dayIdeas.map((item) => (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => onOpenIdea(item)}
                      style={{
                        background: 'var(--card-bg)',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xs)',
                        cursor: 'pointer',
                        fontSize: 'var(--text-xs)',
                      }}
                      title={`${item.title} - ${item.project_name || 'Project'}`}
                    >
                      <div
                        style={{
                          fontWeight: 'var(--weight-semibold)',
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {item.type === 'project' ? <Folder size={10} /> : null}
                        {item.title}
                      </div>
                      {item.scheduled_time && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.scheduled_time}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

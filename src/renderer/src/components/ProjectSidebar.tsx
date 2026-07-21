import { motion } from 'framer-motion';
import {
  LayoutDashboard, Calendar, BarChart3, Settings,
  Folder, PanelLeftClose, Home, Inbox,
} from 'lucide-react';
import { Button } from './ui/Button';
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from '../lib/constants';

interface ProjectSidebarProps {
  onOpenTools: () => void;
  currentView: 'dashboard' | 'project' | 'inbox' | 'calendar' | 'workflow';
  onViewChange: (view: 'dashboard' | 'project' | 'inbox' | 'calendar' | 'workflow') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ProjectSidebar({
  onOpenTools,
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
}: ProjectSidebarProps) {
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
        {/* Collapsed state: Logo centered */}
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

      {/* Spacer */}
      <div style={{ flex: 1 }} />

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
    </motion.div>
  );
}

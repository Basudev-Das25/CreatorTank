import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRight } from 'lucide-react';
import { ProjectSidebar } from './components/ProjectSidebar';
import { Dashboard } from './components/Dashboard';
import { IdeaPanel } from './components/IdeaPanel';
import { ContentWorkspace } from './components/ContentWorkspace';
import { InboxPanel } from './components/InboxPanel';
import { QuickCapture } from './components/QuickCapture';
import { SearchModal } from './components/SearchModal';
import { ToolsPanel } from './components/ToolsPanel';
import { CalendarView } from './components/CalendarView';
import { WorkflowBoard } from './components/WorkflowBoard';
import { ScheduleDialog } from './components/ScheduleDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Teleprompter } from './components/Teleprompter';
import { Button } from './components/ui/Button';
import { viewTransition } from './lib/animations';
import { SIDEBAR_COLLAPSED_WIDTH } from './lib/constants';

interface Project {
  id: number;
  name: string;
  platform: string;
  idea_count?: number;
  last_activity?: string;
}

interface Idea {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status?: string;
  priority?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  workflow_stage?: string;
}

type ViewType = 'dashboard' | 'project' | 'inbox' | 'calendar' | 'workflow';

interface PanelState {
  view: ViewType;
  project: Project | null;
  idea: Idea | null;
}

function App(): JSX.Element {
  // Primary panel state
  const [primaryPanel, setPrimaryPanel] = useState<PanelState>({
    view: 'dashboard',
    project: null,
    idea: null,
  });

  // Secondary panel state
  const [secondaryPanel, setSecondaryPanel] = useState<PanelState>({
    view: 'dashboard',
    project: null,
    idea: null,
  });

  // Split view
  const [isSplitView, setIsSplitView] = useState(false);
  const [activePanel, setActivePanel] = useState<'primary' | 'secondary'>('primary');
  const [splitWidth, setSplitWidth] = useState(50);
  const [resizingSplit, setResizingSplit] = useState(false);

  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [itemToSchedule, setItemToSchedule] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [teleprompterContent, setTeleprompterContent] = useState('');
  const sidebarWidth = 280;

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [settings, setSettings] = useState<any>({});

  // Navigation helpers
  const navigatePrimary = useCallback((view: ViewType, project?: Project | null, idea?: Idea | null) => {
    setPrimaryPanel({
      view,
      project: project !== undefined ? project : null,
      idea: idea !== undefined ? idea : null,
    });
  }, []);

  const navigateSecondary = useCallback((view: ViewType, project?: Project | null, idea?: Idea | null) => {
    setSecondaryPanel({
      view,
      project: project !== undefined ? project : null,
      idea: idea !== undefined ? idea : null,
    });
  }, []);

  const navigateActive = useCallback((view: ViewType, project?: Project | null, idea?: Idea | null) => {
    if (activePanel === 'primary') {
      navigatePrimary(view, project, idea);
    } else {
      navigateSecondary(view, project, idea);
    }
  }, [activePanel, navigatePrimary, navigateSecondary]);

  const loadSettings = async () => {
    const res = await (window as any).api.getSettings();
    if (res.success) setSettings(res.data || {});
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Theme logic
  useEffect(() => {
    const applyTheme = () => {
      const mode = settings.theme_mode || 'system';
      let isLight = mode === 'light';
      if (mode === 'system') {
        isLight = !window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      document.body.classList.toggle('light-theme', isLight);
    };

    applyTheme();

    if (settings.theme_mode === 'system' || !settings.theme_mode) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return undefined;
  }, [settings.theme_mode]);

  const matchShortcut = (e: KeyboardEvent, shortcut: string) => {
    if (!shortcut || !shortcut.trim()) return false;
    const parts = shortcut.toLowerCase().split('+').map((p) => p.trim());
    const key = parts.pop();
    const ctrl = parts.includes('ctrl') || parts.includes('control');
    const shift = parts.includes('shift');
    const alt = parts.includes('alt');
    const meta = parts.includes('meta') || parts.includes('command') || parts.includes('win');
    return (
      e.key.toLowerCase() === key?.toLowerCase() &&
      e.ctrlKey === ctrl &&
      e.shiftKey === shift &&
      e.altKey === alt &&
      e.metaKey === meta
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          if (isSearchOpen) setIsSearchOpen(false);
          if (isToolsOpen) setIsToolsOpen(false);
          if (isQuickCaptureOpen) setIsQuickCaptureOpen(false);
          if (isScheduleDialogOpen) setIsScheduleDialogOpen(false);
        }
        return;
      }
      if (matchShortcut(e, settings.shortcut_search)) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (matchShortcut(e, settings.shortcut_sidebar)) {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
      if (matchShortcut(e, settings.shortcut_schedule)) {
        const currentIdea = activePanel === 'primary' ? primaryPanel.idea : secondaryPanel.idea;
        if (currentIdea && !isSearchOpen && !isToolsOpen) {
          e.preventDefault();
          setItemToSchedule(currentIdea);
          setIsScheduleDialogOpen(true);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
      // Teleprompter: Ctrl+Shift+T
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        openTeleprompter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isToolsOpen, isScheduleDialogOpen, isQuickCaptureOpen, activePanel, primaryPanel.idea, secondaryPanel.idea]);

  // Split view resize logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingSplit) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          const rect = mainContent.getBoundingClientRect();
          const relativeX = e.clientX - rect.left;
          const percentage = (relativeX / rect.width) * 100;
          setSplitWidth(Math.max(20, Math.min(80, percentage)));
        }
      }
    };

    const handleMouseUp = () => {
      if (resizingSplit) {
        setResizingSplit(false);
        document.body.style.cursor = 'default';
      }
    };

    if (resizingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingSplit]);

  const handleSearchResult = async (type: string, projectId: number, ideaId?: number) => {
    const projectsRes = await (window as any).api.getAllProjects();
    if (projectsRes.success && projectsRes.data) {
      const project = projectsRes.data.find((p: any) => p.id === projectId);
      if (project) {
        if (ideaId && (type === 'idea' || type === 'script')) {
          const ideasRes = await (window as any).api.getIdeasByProject(projectId);
          if (ideasRes.success && ideasRes.data) {
            const idea = ideasRes.data.find((i: any) => i.id === ideaId);
            if (idea) {
              navigateActive('project', project, idea);
            }
          }
        } else {
          navigateActive('project', project, null);
        }
      }
    }
    setIsSearchOpen(false);
  };

  const handleConvertInboxItem = async (item: any) => {
    const currentProject = activePanel === 'primary' ? primaryPanel.project : secondaryPanel.project;
    if (currentProject) {
      const res = await (window as any).api.convertInboxItem(item.id, currentProject.id);
      if (res.success) {
        navigateActive('project', currentProject, null);
      }
    } else {
      navigateActive('project');
    }
  };

  const openTeleprompter = useCallback(async () => {
    // Get the current idea's script content
    const currentIdea = activePanel === 'primary' ? primaryPanel.idea : secondaryPanel.idea;
    if (currentIdea) {
      const res = await (window as any).api.getScript(currentIdea.id);
      if (res.success && res.data?.content) {
        setTeleprompterContent(res.data.content);
        setIsTeleprompterOpen(true);
      }
    }
  }, [activePanel, primaryPanel.idea, secondaryPanel.idea]);

  const renderContent = (
    state: PanelState,
    panel: 'primary' | 'secondary',
  ) => {
    const setProject = (p: Project | null) => {
      if (panel === 'primary') {
        setPrimaryPanel(prev => ({ ...prev, project: p }));
      } else {
        setSecondaryPanel(prev => ({ ...prev, project: p }));
      }
    };

    const setIdea = (i: Idea | null) => {
      if (panel === 'primary') {
        setPrimaryPanel(prev => ({ ...prev, idea: i }));
      } else {
        setSecondaryPanel(prev => ({ ...prev, idea: i }));
      }
    };

    const setView = (v: ViewType) => {
      if (panel === 'primary') {
        setPrimaryPanel(prev => ({ ...prev, view: v }));
      } else {
        setSecondaryPanel(prev => ({ ...prev, view: v }));
      }
    };

    if (state.view === 'dashboard') {
      return (
        <Dashboard
          onNavigate={setView}
          onSelectProject={(p) => {
            setProject(p);
            setIdea(null);
            setView('project');
          }}
          onSelectIdea={(i) => {
            // For dashboard items, open in current panel
            const projectsRes = (window as any).api.getAllProjects();
            projectsRes.then((res: any) => {
              if (res.success && res.data) {
                const project = res.data.find((p: any) => p.id === i.project_id);
                if (project) {
                  setProject(project);
                  setIdea(i);
                  setView('project');
                }
              }
            });
          }}
        />
      );
    }

    if (state.view === 'inbox') {
      return <InboxPanel onConvertToIdea={handleConvertInboxItem} />;
    }

    if (state.view === 'project') {
      if (state.project) {
        if (state.idea) {
          return (
            <ContentWorkspace
              idea={state.idea as any}
              onBack={() => setIdea(null)}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          );
        }
        return (
          <IdeaPanel
            project={state.project}
            onSelectIdea={(i) => setIdea(i)}
            onScheduleIdea={(i) => {
              setItemToSchedule(i);
              setIsScheduleDialogOpen(true);
            }}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        );
      }
      // No project selected, show dashboard
      return (
        <Dashboard
          onNavigate={setView}
          onSelectProject={(p) => {
            setProject(p);
            setIdea(null);
            setView('project');
          }}
          onSelectIdea={(i) => {
            const projectsRes = (window as any).api.getAllProjects();
            projectsRes.then((res: any) => {
              if (res.success && res.data) {
                const project = res.data.find((p: any) => p.id === i.project_id);
                if (project) {
                  setProject(project);
                  setIdea(i);
                  setView('project');
                }
              }
            });
          }}
        />
      );
    }

    if (state.view === 'calendar') {
      return (
        <CalendarView
          onOpenIdea={(i) => {
            const projectsRes = (window as any).api.getAllProjects();
            projectsRes.then((res: any) => {
              if (res.success && res.data) {
                const project = res.data.find((p: any) => p.id === i.project_id);
                if (project) {
                  setProject(project);
                  setIdea(i);
                  setView('project');
                }
              }
            });
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      );
    }

    if (state.view === 'workflow') {
      return (
        <WorkflowBoard
          onOpenIdea={(i) => {
            const projectsRes = (window as any).api.getAllProjects();
            projectsRes.then((res: any) => {
              if (res.success && res.data) {
                const project = res.data.find((p: any) => p.id === i.project_id);
                if (project) {
                  setProject(project);
                  setIdea(i);
                  setView('project');
                }
              }
            });
          }}
          onScheduleItem={(i) => {
            setItemToSchedule(i);
            setIsScheduleDialogOpen(true);
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      );
    }

    return null;
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg)',
        color: 'var(--text-main)',
        position: 'relative',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth,
          display: 'flex',
          overflow: 'hidden',
          transition: 'var(--sidebar-transition)',
          flexShrink: 0,
        }}
      >
        <ProjectSidebar
          onSelectProject={(p) => {
            navigateActive('project', p, null);
          }}
          selectedProjectId={activePanel === 'primary' ? primaryPanel.project?.id : secondaryPanel.project?.id}
          onOpenTools={() => setIsToolsOpen(true)}
          currentView={activePanel === 'primary' ? primaryPanel.view : secondaryPanel.view}
          onViewChange={(v) => navigateActive(v)}
          onScheduleItem={(item) => {
            setItemToSchedule(item);
            setIsScheduleDialogOpen(true);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onConfirmDelete={(title: string, message: string, onConfirm: () => void) => {
            setConfirmState({ isOpen: true, title, message, onConfirm });
          }}
        />
      </div>

      {/* Main Content Area */}
      <div
        id="main-content"
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Primary Panel */}
        <div
          onClick={() => setActivePanel('primary')}
          style={{
            flex: isSplitView ? `0 0 ${splitWidth}%` : 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            borderRight: isSplitView && activePanel === 'primary' ? '2px solid var(--primary)' : isSplitView ? '1px solid var(--border)' : 'none',
            transition: 'border 0.15s',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={primaryPanel.view + (primaryPanel.idea?.id || '') + (primaryPanel.project?.id || '')}
              initial={viewTransition.initial}
              animate={viewTransition.animate}
              exit={viewTransition.exit}
              transition={viewTransition.transition}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {renderContent(primaryPanel, 'primary')}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Split View Divider and Second Panel */}
        <AnimatePresence>
          {isSplitView && (
            <>
              {/* Divider */}
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 6 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  flexShrink: 0,
                  cursor: 'col-resize',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: resizingSplit ? 'var(--primary-light)' : 'transparent',
                  transition: 'background 0.15s',
                  zIndex: 10,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setResizingSplit(true);
                }}
              >
                <div
                  style={{
                    width: 2,
                    height: 40,
                    borderRadius: 'var(--radius-full)',
                    background: resizingSplit ? 'var(--primary)' : 'var(--border-strong)',
                    transition: 'all 0.15s',
                  }}
                />
              </motion.div>

              {/* Second Panel */}
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: `${100 - splitWidth}%` }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => setActivePanel('secondary')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  background: 'var(--bg)',
                  borderLeft: activePanel === 'secondary' ? '2px solid var(--primary)' : 'none',
                  transition: 'border 0.15s',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={secondaryPanel.view + (secondaryPanel.idea?.id || '') + (secondaryPanel.project?.id || '')}
                    initial={viewTransition.initial}
                    animate={viewTransition.animate}
                    exit={viewTransition.exit}
                    transition={viewTransition.transition}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                  >
                    {renderContent(secondaryPanel, 'secondary')}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Split View Toggle Button - Fixed bottom right */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          right: 'var(--space-6)',
          zIndex: 1000,
        }}
      >
        <Button
          variant={isSplitView ? 'primary' : 'secondary'}
          size="md"
          onClick={() => setIsSplitView(!isSplitView)}
          icon={<PanelRight size={18} />}
          title={isSplitView ? 'Exit Split View' : 'Split View'}
          style={{
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {isSplitView ? 'Exit Split' : 'Split View'}
        </Button>
      </div>

      {/* Modals */}
      {isSearchOpen && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectResult={handleSearchResult}
        />
      )}

      {isToolsOpen && (
        <ToolsPanel
          isOpen={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          currentProject={activePanel === 'primary' ? primaryPanel.project : secondaryPanel.project}
          settings={settings}
          onSettingsUpdate={loadSettings}
        />
      )}

      <QuickCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      <ScheduleDialog
        isOpen={isScheduleDialogOpen}
        onClose={() => setIsScheduleDialogOpen(false)}
        item={itemToSchedule}
        onScheduled={() => {}}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Teleprompter */}
      <AnimatePresence>
        {isTeleprompterOpen && (
          <Teleprompter
            content={teleprompterContent}
            onClose={() => setIsTeleprompterOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

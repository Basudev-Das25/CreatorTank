import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { IdeaPanel } from "./components/IdeaPanel";
import { ScriptEditor } from "./components/ScriptEditor";
import { AssetPanel } from "./components/AssetPanel";
import { SearchModal } from "./components/SearchModal";
import { ToolsPanel } from "./components/ToolsPanel";
import { CalendarView } from "./components/CalendarView";
import { WorkflowBoard } from "./components/WorkflowBoard";
import { ScheduleDialog } from "./components/ScheduleDialog";
import { ResizableHandle } from "./components/ResizableHandle";
import { ConfirmDialog } from "./components/ConfirmDialog";

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
    scheduled_date?: string;
    scheduled_time?: string;
    workflow_stage?: string;
}

function App(): JSX.Element {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);

    // Phase 5 views
    const [currentView, setCurrentView] = useState<'project' | 'calendar' | 'workflow'>('project');
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [itemToSchedule, setItemToSchedule] = useState<any>(null);

    // Phase 6: Fluid UI state
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [assetPanelWidth, setAssetPanelWidth] = useState(330);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isAssetPanelOpen, setIsAssetPanelOpen] = useState(true);
    const [resizingSide, setResizingSide] = useState<'sidebar' | 'asset' | null>(null);

    // Confirmation Dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Settings & Shortcuts
    const [settings, setSettings] = useState<any>({});

    const loadSettings = async () => {
        const res = await window.api.getSettings();
        if (res.success) setSettings(res.data || {});
    };

    useEffect(() => {
        loadSettings();
    }, []);

    // Theme logic
    useEffect(() => {
        const applyTheme = () => {
            const mode = settings.theme_mode || 'system';
            let isDark = mode === 'dark';
            if (mode === 'system') {
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            document.body.classList.toggle('dark-theme', isDark);
        };

        applyTheme();

        // Listen for system theme changes if in system mode
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

        const parts = shortcut.toLowerCase().split('+').map(p => p.trim());
        const key = parts.pop();
        const ctrl = parts.includes('ctrl') || parts.includes('control');
        const shift = parts.includes('shift');
        const alt = parts.includes('alt');
        const meta = parts.includes('meta') || parts.includes('command') || parts.includes('win');

        // Normalize e.key for comparison
        const eventKey = e.key.toLowerCase();
        const targetKey = key?.toLowerCase();

        return eventKey === targetKey &&
            e.ctrlKey === ctrl &&
            e.shiftKey === shift &&
            e.altKey === alt &&
            e.metaKey === meta;
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore shortcuts if user is typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                // Allow escape to close modals even if focused
                if (e.key === 'Escape') {
                    if (isSearchOpen) setIsSearchOpen(false);
                    if (isToolsOpen) setIsToolsOpen(false);
                    if (isScheduleDialogOpen) setIsScheduleDialogOpen(false);
                }
                return;
            }

            // Search
            if (matchShortcut(e, settings.shortcut_search)) {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
            // Sidebar
            if (matchShortcut(e, settings.shortcut_sidebar)) {
                e.preventDefault();
                setIsSidebarCollapsed(prev => !prev);
            }
            // Schedule
            if (matchShortcut(e, settings.shortcut_schedule)) {
                if (selectedIdea && !isSearchOpen && !isToolsOpen) {
                    e.preventDefault();
                    setItemToSchedule(selectedIdea);
                    setIsScheduleDialogOpen(true);
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (resizingSide === 'sidebar') {
                const newWidth = Math.max(200, Math.min(600, e.clientX));
                setSidebarWidth(newWidth);
            } else if (resizingSide === 'asset') {
                const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
                setAssetPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setResizingSide(null);
            document.body.style.cursor = 'default';
        };

        if (resizingSide) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [selectedIdea, isSearchOpen, isToolsOpen, resizingSide]);

    const handleSelectIdea = (idea: any) => {
        setSelectedIdea(idea);
    };

    const handleSearchResult = async (type: string, projectId: number, ideaId?: number) => {
        const projectsRes = await window.api.getAllProjects();
        if (projectsRes.success && projectsRes.data) {
            const project = projectsRes.data.find((p: any) => p.id === projectId);
            if (project) {
                setSelectedProject(project);
                setCurrentView('project');
                if (ideaId && (type === 'idea' || type === 'script')) {
                    const ideasRes = await window.api.getIdeasByProject(projectId);
                    if (ideasRes.success && ideasRes.data) {
                        const idea = ideasRes.data.find((i: any) => i.id === ideaId);
                        if (idea) setSelectedIdea(idea);
                    }
                } else {
                    setSelectedIdea(null);
                }
            }
        }
        setIsSearchOpen(false);
    };

    const handleOpenIdeaFromGlobalView = async (ideaItem: any) => {
        const projectsRes = await window.api.getAllProjects();
        if (projectsRes.success && projectsRes.data) {
            const project = projectsRes.data.find((p: any) => p.id === ideaItem.project_id);
            if (project) {
                setSelectedProject(project);
                setSelectedIdea(ideaItem);
                setCurrentView('project');
            }
        }
    };

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg)", color: "var(--text-main)", transition: "var(--transition)" }}>
            <div style={{ width: isSidebarCollapsed ? 0 : sidebarWidth, display: "flex", overflow: "hidden", transition: resizingSide ? "none" : "var(--sidebar-transition)" }}>
                <ProjectSidebar
                    onSelectProject={(p) => { setSelectedProject(p); setSelectedIdea(null); setCurrentView('project'); }}
                    selectedProjectId={selectedProject?.id}
                    onOpenTools={() => setIsToolsOpen(true)}
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    onScheduleItem={(item) => { setItemToSchedule(item); setIsScheduleDialogOpen(true); }}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onConfirmDelete={(title: string, message: string, onConfirm: () => void) => {
                        setConfirmState({ isOpen: true, title, message, onConfirm });
                    }}
                />
            </div>

            {!isSidebarCollapsed && (
                <ResizableHandle
                    onMouseDown={() => setResizingSide('sidebar')}
                    isResizing={resizingSide === 'sidebar'}
                />
            )}

            <div
                style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden", position: 'relative' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentView + (selectedIdea?.id || '') + (selectedProject?.id || '')}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
                    >
                        {currentView === 'project' ? (
                            selectedProject ? (
                                selectedIdea ? (
                                    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                                        <ScriptEditor
                                            ideaId={selectedIdea.id}
                                            ideaTitle={selectedIdea.title}
                                            onBack={() => setSelectedIdea(null)}
                                            isAssetPanelOpen={isAssetPanelOpen}
                                            onToggleAssetPanel={() => setIsAssetPanelOpen(!isAssetPanelOpen)}
                                            isSidebarCollapsed={isSidebarCollapsed}
                                            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                        />
                                        {isAssetPanelOpen && (
                                            <>
                                                <ResizableHandle
                                                    onMouseDown={() => setResizingSide('asset')}
                                                    isResizing={resizingSide === 'asset'}
                                                />
                                                <motion.div
                                                    initial={{ width: 0, opacity: 0 }}
                                                    animate={{ width: assetPanelWidth, opacity: 1 }}
                                                    exit={{ width: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <AssetPanel ideaId={selectedIdea.id} />
                                                </motion.div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <IdeaPanel
                                        project={selectedProject}
                                        onSelectIdea={handleSelectIdea}
                                        onScheduleIdea={(idea) => { setItemToSchedule(idea); setIsScheduleDialogOpen(true); }}
                                        isSidebarCollapsed={isSidebarCollapsed}
                                        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    />
                                )
                            ) : (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                        style={{ fontSize: "5rem", marginBottom: "24px", filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }}
                                    >
                                        🚀
                                    </motion.div>
                                    <h2 style={{ margin: "0 0 12px 0", color: "var(--text-main)", fontSize: "1.75rem", fontWeight: 800 }}>Welcome to CreatorTank</h2>
                                    <p style={{ maxWidth: "420px", lineHeight: 1.6, fontSize: '1.05rem' }}>
                                        Your local-first creative command center. Select a project to begin or press <strong>Ctrl + K</strong>.
                                    </p>
                                    <div style={{ marginTop: "40px", display: "flex", gap: "16px" }}>
                                        <button onClick={() => setCurrentView('calendar')} style={welcomeBtnStyle}>📅 Calendar View</button>
                                        <button onClick={() => setCurrentView('workflow')} style={welcomeBtnStyle}>📊 Workflow Board</button>
                                    </div>
                                </div>
                            )
                        ) : currentView === 'calendar' ? (
                            <CalendarView
                                onOpenIdea={handleOpenIdeaFromGlobalView}
                                isSidebarCollapsed={isSidebarCollapsed}
                                onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            />
                        ) : (
                            <WorkflowBoard
                                onOpenIdea={handleOpenIdeaFromGlobalView}
                                onScheduleItem={(idea) => { setItemToSchedule(idea); setIsScheduleDialogOpen(true); }}
                                isSidebarCollapsed={isSidebarCollapsed}
                                onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

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
                    currentProject={selectedProject}
                    settings={settings}
                    onSettingsUpdate={loadSettings}
                />
            )}

            <ScheduleDialog
                isOpen={isScheduleDialogOpen}
                onClose={() => setIsScheduleDialogOpen(false)}
                item={itemToSchedule}
                onScheduled={() => {
                    // Force refresh logic if needed
                }}
            />

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={() => {
                    confirmState.onConfirm();
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                }}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

const welcomeBtnStyle: React.CSSProperties = {
    padding: "10px 20px", background: "var(--card-bg)", border: "1px solid var(--border)",
    borderRadius: "8px", cursor: "pointer", fontWeight: 600, color: "var(--text-main)",
    transition: "var(--transition)"
};

export default App;

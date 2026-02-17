import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Calendar,
    BarChart3,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Heart,
    Settings,
    Folder,
    Youtube,
    Instagram,
    Mic,
    FileText
} from "lucide-react";

interface Project {
    id: number;
    name: string;
    platform: string;
    idea_count?: number;
    last_activity?: string;
    scheduled_date?: string;
    scheduled_time?: string;
}

interface ProjectSidebarProps {
    onSelectProject: (project: Project | null) => void;
    selectedProjectId?: number;
    onOpenTools: () => void;
    currentView: 'project' | 'calendar' | 'workflow';
    onViewChange: (view: 'project' | 'calendar' | 'workflow') => void;
    onScheduleItem: (item: any) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function ProjectSidebar({ onSelectProject, selectedProjectId, onOpenTools, currentView, onViewChange, isCollapsed, onToggleCollapse }: ProjectSidebarProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [platformFilter] = useState("All");
    const [sortBy] = useState<'name' | 'last_activity' | 'idea_count'>('last_activity');
    const [sortOrder] = useState<'asc' | 'desc'>('desc');
    const [showDonateStatus, setShowDonateStatus] = useState(false);

    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectPlatform, setNewProjectPlatform] = useState("YouTube");

    const loadProjects = async () => {
        const res = await window.api.getAllProjects();
        if (res.success) {
            setProjects(res.data || []);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleCreate = async () => {
        if (!newProjectName.trim()) return;
        const res = await window.api.createProject(newProjectName, newProjectPlatform);
        if (res.success) {
            setNewProjectName("");
            loadProjects();
            if (res.id) {
                // Fetch the full project or just set basic info
                onSelectProject({ id: res.id, name: newProjectName, platform: newProjectPlatform });
                onViewChange('project');
            }
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this project and all its ideas?")) {
            await window.api.deleteProject(id);
            if (selectedProjectId === id) onSelectProject(null);
            loadProjects();
        }
    };

    const filteredAndSortedProjects = projects
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPlatform = platformFilter === "All" || p.platform === platformFilter;
            return matchesSearch && matchesPlatform;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === 'idea_count') {
                comparison = (a.idea_count || 0) - (b.idea_count || 0);
            } else {
                comparison = new Date(a.last_activity || 0).getTime() - new Date(b.last_activity || 0).getTime();
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    // const controlStyle: React.CSSProperties = { ... };

    const navItemStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        textAlign: "left",
        fontSize: "0.9rem",
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        transition: "var(--transition)",
        display: "flex",
        alignItems: "center"
    };

    const toggleBtnStyle: React.CSSProperties = {
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: "0.9rem",
        color: "var(--text-muted)",
        transition: "var(--transition)",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'YouTube': return <Youtube size={16} />;
            case 'Instagram': return <Instagram size={16} />;
            case 'Podcast': return <Mic size={16} />;
            case 'Blog': return <FileText size={16} />;
            default: return <Folder size={16} />;
        }
    };

    return (
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? 72 : 280 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
                height: "100%",
                background: "var(--sidebar-bg)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: 'relative',
                zIndex: 10
            }}
        >
            <div style={{ padding: isCollapsed ? "24px 0" : "24px 20px 0 20px", display: "flex", flexDirection: "column", alignItems: isCollapsed ? "center" : "stretch" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between", marginBottom: isCollapsed ? "32px" : "24px" }}>
                    {!isCollapsed && (
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", gap: "10px" }}
                        >
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                                <LayoutDashboard size={20} />
                            </div>
                            CreatorTank
                        </motion.h1>
                    )}
                    {isCollapsed && (
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '10px', display: 'flex', marginBottom: '8px' }}>
                            <LayoutDashboard size={24} />
                        </div>
                    )}
                    <button
                        onClick={onToggleCollapse}
                        style={{ ...toggleBtnStyle, position: isCollapsed ? 'absolute' : 'relative', top: isCollapsed ? '70px' : 'auto' }}
                        title={isCollapsed ? "Expand (Ctrl+B)" : "Collapse (Ctrl+B)"}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>
            </div>

            {/* View Switching Navigation */}
            <div style={{ padding: isCollapsed ? "0 12px" : "12px", display: "flex", flexDirection: "column", gap: "6px", alignItems: isCollapsed ? "center" : "stretch" }}>
                {[
                    { id: 'project', label: 'Projects', icon: <Folder size={18} /> },
                    { id: 'calendar', label: 'Calendar', icon: <Calendar size={18} /> },
                    { id: 'workflow', label: 'Workflow', icon: <BarChart3 size={18} /> }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id as any)}
                        style={{
                            ...navItemStyle,
                            background: currentView === item.id ? "var(--primary-light)" : "transparent",
                            color: currentView === item.id ? "var(--primary)" : "var(--text-main)",
                            padding: isCollapsed ? "12px" : "10px 12px",
                            justifyContent: isCollapsed ? "center" : "flex-start",
                            gap: isCollapsed ? "0" : "12px",
                            position: 'relative'
                        }}
                        title={item.label}
                    >
                        {item.icon}
                        {!isCollapsed && <span>{item.label}</span>}
                        {currentView === item.id && !isCollapsed && (
                            <motion.div
                                layoutId="activeNav"
                                style={{ position: 'absolute', left: 0, width: '3px', height: '60%', background: 'var(--primary)', borderRadius: '0 4px 4px 0' }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {!isCollapsed && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
                    <div style={{ height: "1px", background: "var(--border)", margin: "12px 20px", opacity: 0.3 }}></div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 24px 12px" }}>
                        {/* New Project Form */}
                        <div style={{
                            padding: "16px",
                            background: "var(--glass)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "var(--radius)",
                            border: "1px solid var(--glass-border)",
                            marginBottom: "24px",
                            boxShadow: "var(--glass-shadow)"
                        }}>
                            <input
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Project Name..."
                                style={{
                                    width: "100%",
                                    marginBottom: "10px",
                                    padding: "10px 12px",
                                    borderRadius: "10px",
                                    border: "1px solid var(--border)",
                                    background: "var(--bg)",
                                    color: "var(--text-main)",
                                    boxSizing: "border-box",
                                    fontSize: '0.9rem'
                                }}
                            />
                            <div style={{ display: "flex", gap: "8px" }}>
                                <select
                                    value={newProjectPlatform}
                                    onChange={(e) => setNewProjectPlatform(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        fontSize: "0.85rem",
                                        background: "var(--bg)",
                                        color: "var(--text-main)"
                                    }}
                                >
                                    <option value="YouTube">YouTube</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Podcast">Podcast</option>
                                    <option value="Blog">Blog</option>
                                    <option value="Custom">Custom</option>
                                </select>
                                <button
                                    onClick={handleCreate}
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        background: "var(--primary)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Project Search */}
                        <div style={{ padding: "0 8px 16px 8px" }}>
                            <div style={{ position: "relative", marginBottom: "12px" }}>
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Find projects..."
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px 10px 34px",
                                        borderRadius: "10px",
                                        border: "1px solid var(--border)",
                                        fontSize: "0.85rem",
                                        background: "var(--bg)",
                                        color: "var(--text-main)",
                                        boxSizing: "border-box",
                                        outline: "none",
                                        transition: "var(--transition)"
                                    }}
                                    className="search-input"
                                />
                                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>
                                    <Search size={16} />
                                </span>
                            </div>
                        </div>

                        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", padding: "0 8px 10px 8px", letterSpacing: "0.5px" }}>
                            Recent Projects
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {filteredAndSortedProjects.map(p => (
                                <motion.div
                                    layout
                                    key={p.id}
                                    onClick={() => {
                                        onSelectProject(p);
                                        onViewChange('project');
                                    }}
                                    style={{
                                        padding: "10px 12px",
                                        cursor: "pointer",
                                        background: selectedProjectId === p.id ? "var(--primary-light)" : "transparent",
                                        borderRadius: "10px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        transition: "var(--transition)",
                                        border: selectedProjectId === p.id ? "1px solid var(--primary-light)" : "1px solid transparent"
                                    }}
                                    className="sidebar-item"
                                >
                                    <div style={{ overflow: "hidden", flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ color: selectedProjectId === p.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                                            {getPlatformIcon(p.platform)}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{
                                                fontWeight: 600,
                                                color: selectedProjectId === p.id ? "var(--primary)" : "var(--text-main)",
                                                whiteSpace: "nowrap",
                                                textOverflow: "ellipsis",
                                                overflow: "hidden",
                                                fontSize: '0.9rem'
                                            }}>
                                                {p.name}
                                            </div>
                                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                                {p.idea_count || 0} ideas
                                            </div>
                                        </div>
                                    </div>
                                    <div className="item-actions" style={{ display: "flex", alignItems: "center", opacity: 0 }}>
                                        <button
                                            onClick={(e) => handleDelete(p.id, e)}
                                            style={{ padding: "4px", color: "var(--danger)", border: "none", background: "none", cursor: 'pointer' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}


            <div style={{ padding: isCollapsed ? "12px" : "20px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border)", background: 'var(--sidebar-bg)' }}>
                <button
                    onClick={() => {
                        setShowDonateStatus(true);
                        setTimeout(() => setShowDonateStatus(false), 3000);
                    }}
                    style={{
                        padding: isCollapsed ? "10px" : "12px",
                        background: "rgba(236, 72, 153, 0.08)",
                        border: "1px solid rgba(236, 72, 153, 0.1)",
                        borderRadius: "10px",
                        color: "#ec4899",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        gap: "12px",
                        fontSize: '0.9rem'
                    }}
                    className="donate-btn"
                    title="Support CreatorTank"
                >
                    <Heart size={18} fill={showDonateStatus ? "#ec4899" : "none"} />
                    {!isCollapsed && "Support"}
                </button>
                <button
                    onClick={onOpenTools}
                    style={{
                        padding: isCollapsed ? "10px" : "12px",
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        color: "var(--text-main)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        gap: "12px",
                        fontSize: '0.9rem'
                    }}
                    className="tools-btn"
                    title="Settings"
                >
                    <Settings size={18} />
                    {!isCollapsed && "Settings"}
                </button>
            </div>

            <style>
                {`
                .sidebar-item:hover { background: var(--bg); }
                .sidebar-item:hover .item-actions { opacity: 1; }
                .search-input:focus { border-color: var(--primary) !important; background: var(--card-bg) !important; box-shadow: 0 0 0 3px var(--primary-light); }
                .donate-btn:hover { background: rgba(236, 72, 153, 0.15) !important; }
                .tools-btn:hover { background: var(--primary-light) !important; border-color: var(--primary); color: var(--primary); }
                `}
            </style>
        </motion.div >
    );
}

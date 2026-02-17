import { useState, useEffect } from "react";

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

interface IdeaPanelProps {
    project: any;
    onSelectIdea: (idea: any) => void;
    onScheduleIdea: (idea: any) => void;
    isSidebarCollapsed: boolean;
    onToggleSidebar: () => void;
}

export function IdeaPanel({ project, onSelectIdea, onScheduleIdea, isSidebarCollapsed, onToggleSidebar }: IdeaPanelProps) {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // New Idea Form State
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newPriority, setNewPriority] = useState("medium");

    const loadIdeas = async () => {
        const res = await window.api.getIdeasByProject(project.id);
        if (res.success) setIdeas(res.data || []);
    };

    useEffect(() => {
        loadIdeas();

        // Listen for updates from other panels (e.g., AssetPanel)
        const handleIdeaUpdate = (e: any) => {
            const { ideaId, ...updates } = e.detail;
            setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, ...updates } : i));
        };

        window.addEventListener('idea-updated', handleIdeaUpdate);
        return () => window.removeEventListener('idea-updated', handleIdeaUpdate);
    }, [project.id]);

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        const res = await window.api.createIdea(project.id, newTitle, newDesc, newPriority);
        if (res.success) {
            setNewTitle("");
            setNewDesc("");
            loadIdeas();
        }
    };

    const handleUpdate = async (id: number, field: string, value: any) => {
        const res = await window.api.updateIdea(id, { [field]: value });
        if (res.success) {
            setIdeas(ideas.map(i => i.id === id ? { ...i, [field]: value } : i));
        }
    };

    const handlePickOutputPath = async (id: number) => {
        const res = await window.api.pickOutputPath();
        if (res.success && res.path) {
            handleUpdate(id, 'output_path', res.path);
        }
    };

    const handleOpenOutput = (path: string | undefined) => {
        if (path) window.api.openAsset(path);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Delete this idea?")) {
            const res = await window.api.deleteIdea(id);
            if (res.success) loadIdeas();
        }
    };

    const filteredIdeas = ideas.filter(i =>
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ flex: 1, padding: "32px", overflowY: "auto", background: "var(--bg)" }}>
            <div style={{ width: "100%", margin: "0" }}>
                {/* Toolbar / Search */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {isSidebarCollapsed && (
                            <button
                                onClick={onToggleSidebar}
                                style={{
                                    background: "var(--card-bg)",
                                    color: "var(--text-main)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "6px",
                                    width: "36px",
                                    height: "36px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    fontSize: "1.2rem",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                    transition: "var(--transition)"
                                }}
                                title="Show Sidebar (Ctrl+B)"
                            >
                                ☰
                            </button>
                        )}
                        <h2 style={{ margin: 0, color: "var(--text-main)", fontWeight: 700 }}>Project Ideas</h2>
                    </div>
                    <div style={{ position: "relative", width: "300px" }}>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search ideas..."
                            style={{
                                width: "100%",
                                padding: "10px 12px 10px 32px",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                fontSize: "0.85rem",
                                background: "var(--card-bg)",
                                color: "var(--text-main)",
                                boxSizing: "border-box",
                                outline: "none",
                                transition: "var(--transition)"
                            }}
                            className="search-input"
                        />
                        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>
                            🔍
                        </span>
                    </div>
                </div>

                {/* New Idea Form */}
                <div style={{
                    background: "var(--glass)",
                    backdropFilter: "blur(12px)",
                    padding: "24px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--glass-border)",
                    marginBottom: "32px",
                    boxShadow: "var(--shadow-lg)",
                    transition: "var(--transition)"
                }}>
                    <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                        <input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Quick Idea Title..."
                            style={{
                                flex: 2, padding: "12px", borderRadius: "8px",
                                color: "var(--text-main)",
                                border: "1px solid var(--border)", fontSize: "1rem", outline: "none",
                                background: "var(--bg)"
                            }}
                        />
                        <select
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value)}
                            style={{
                                flex: 0.5, padding: "12px", borderRadius: "8px",
                                border: "1px solid var(--border)", background: "var(--bg)",
                                color: "var(--text-main)"
                            }}
                        >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                        </select>
                        <button
                            onClick={handleCreate}
                            style={{
                                flex: 0.5, padding: "12px", background: "var(--primary)",
                                color: "white", border: "none", borderRadius: "8px",
                                fontWeight: 700, cursor: "pointer"
                            }}
                        >
                            Add Idea
                        </button>
                    </div>
                </div>

                {/* Ideas Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "20px" }}>
                    {filteredIdeas.length === 0 && (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            {searchTerm ? `No ideas matching "${searchTerm}"` : "No ideas yet. Start capturing above!"}
                        </div>
                    )}
                    {filteredIdeas.map(idea => (
                        <div key={idea.id} style={cardStyle} className="idea-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                <input
                                    value={idea.title}
                                    onChange={(e) => handleUpdate(idea.id, "title", e.target.value)}
                                    style={cardTitleInputStyle}
                                />
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button onClick={() => onSelectIdea(idea)} style={openBtnStyle}>Open</button>
                                    <button onClick={() => handleDelete(idea.id)} style={deleteBtnStyle}>&times;</button>
                                </div>
                            </div>

                            <textarea
                                value={idea.description || ""}
                                onChange={(e) => handleUpdate(idea.id, "description", e.target.value)}
                                placeholder="Add description..."
                                style={cardDescStyle}
                            />

                            {/* Final Output Section */}
                            <div style={{
                                marginTop: "8px",
                                padding: "10px",
                                background: "var(--bg)",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Final Output
                                    </span>
                                    {idea.output_path && (
                                        <button
                                            onClick={() => handleUpdate(idea.id, 'output_path', null)}
                                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {idea.output_path ? (
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <div style={{
                                            flex: 1,
                                            fontSize: "0.8rem",
                                            color: "var(--text-main)",
                                            background: "rgba(0,0,0,0.03)",
                                            padding: "6px 10px",
                                            borderRadius: "6px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}>
                                            {idea.output_path.split(/[\\/]/).pop()}
                                        </div>
                                        <button
                                            onClick={() => handleOpenOutput(idea.output_path)}
                                            style={{ ...openBtnStyle, padding: "4px 10px", fontSize: "0.75rem" }}
                                        >
                                            🚀 Launch
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handlePickOutputPath(idea.id)}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px dashed var(--border)",
                                            background: "none",
                                            borderRadius: "6px",
                                            color: "var(--text-muted)",
                                            fontSize: "0.8rem",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            transition: "var(--transition)"
                                        }}
                                        className="pick-path-btn"
                                    >
                                        + Link Result (Video, Image, etc.)
                                    </button>
                                )}
                            </div>

                            <div style={cardFooterStyle}>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <select
                                        value={idea.workflow_stage || 'idea'}
                                        onChange={(e) => handleUpdate(idea.id, "workflow_stage", e.target.value)}
                                        style={stageSelectStyle}
                                    >
                                        <option value="idea">Idea</option>
                                        <option value="writing">Writing</option>
                                        <option value="recording">Recording</option>
                                        <option value="editing">Editing</option>
                                        <option value="ready">Ready</option>
                                        <option value="published">Published</option>
                                    </select>
                                    {idea.scheduled_date ? (
                                        <span
                                            onClick={(e) => { e.stopPropagation(); onScheduleIdea(idea); }}
                                            style={{ ...scheduleBadgeStyle, cursor: "pointer", padding: "2px 6px", background: "var(--bg)", borderRadius: "4px", border: "1px solid var(--border)" }}
                                            title="Click to reschedule"
                                        >
                                            📅 {idea.scheduled_date}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onScheduleIdea(idea); }}
                                            style={scheduleBtnStyle}
                                        >
                                            📅 Schedule
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <select
                                        value={idea.priority}
                                        onChange={(e) => handleUpdate(idea.id, "priority", e.target.value)}
                                        style={{
                                            ...priorityBadgeStyle,
                                            background: idea.priority === 'high' ? 'rgba(239, 68, 68, 0.15)' : idea.priority === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                                            color: idea.priority === 'high' ? "#ef4444" : idea.priority === 'medium' ? "#f59e0b" : "var(--text-muted)"
                                        }}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Med</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>
                {`
                .idea-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary) !important; }
                .search-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.1); }
                .pick-path-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
                `}
            </style>
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    border: "1px solid var(--glass-border)", borderRadius: "var(--radius)", padding: "20px",
    background: "var(--card-bg)", boxShadow: "var(--shadow)", transition: "var(--transition)",
    display: "flex", flexDirection: "column", gap: "8px"
};

const cardTitleInputStyle: React.CSSProperties = {
    fontWeight: 700, border: "none", fontSize: "1.1rem", flex: 1,
    background: "transparent", outline: "none", color: "var(--text-main)"
};

const openBtnStyle: React.CSSProperties = {
    background: "var(--bg)", color: "var(--primary)", border: "1px solid var(--border)",
    borderRadius: "6px", padding: "6px 12px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
    transition: "var(--transition)"
};

const deleteBtnStyle: React.CSSProperties = {
    color: "#ef4444", border: "none", background: "none", padding: "4px",
    fontSize: "1.2rem", lineHeight: 1, cursor: "pointer"
};

const cardDescStyle: React.CSSProperties = {
    border: "none", fontSize: "0.9rem", resize: "none", background: "transparent",
    outline: "none", color: "var(--text-muted)", height: "60px", fontFamily: "inherit"
};

const cardFooterStyle: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(0,0,0,0.05)"
};

const stageSelectStyle: React.CSSProperties = {
    fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px",
    border: "1px solid var(--border)", background: "var(--bg)", fontWeight: 600, color: "var(--primary)"
};

const scheduleBadgeStyle: React.CSSProperties = {
    fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px"
};

const scheduleBtnStyle: React.CSSProperties = {
    fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px",
    border: "1px solid var(--border)", background: "var(--bg)", fontWeight: 600,
    color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
    transition: "var(--transition)"
};

const priorityBadgeStyle: React.CSSProperties = {
    fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px", border: "none", fontWeight: 700
};

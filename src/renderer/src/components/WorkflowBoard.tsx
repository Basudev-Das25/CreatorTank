import { useState, useEffect } from "react";

interface Idea {
    id: number;
    project_id: number;
    title: string;
    description: string;
    workflow_stage: string;
    priority: string;
    project_name?: string;
    scheduled_date?: string;
}

const STAGES = [
    { id: 'idea', label: 'Idea' },
    { id: 'writing', label: 'Writing' },
    { id: 'recording', label: 'Recording' },
    { id: 'editing', label: 'Editing' },
    { id: 'ready', label: 'Ready' },
    { id: 'published', label: 'Published' }
];

interface WorkflowBoardProps {
    onOpenIdea: (idea: any) => void;
    onScheduleItem: (item: any) => void;
    isSidebarCollapsed: boolean;
    onToggleSidebar: () => void;
}

export function WorkflowBoard({ onOpenIdea, onScheduleItem, isSidebarCollapsed, onToggleSidebar }: WorkflowBoardProps) {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAllIdeas = async () => {
        setLoading(true);
        // We'll need a new IPC handler for getting ALL ideas if we want a global board
        // For now, let's use getScheduledIdeas as a base or implement ideas:get-all
        const res = await window.api.getScheduledIdeas();
        if (res.success) {
            // Only show ideas in the workflow board
            setIdeas((res.data || []).filter((item: any) => item.type === 'idea'));
        }
        setLoading(false);
    };

    useEffect(() => {
        loadAllIdeas();
    }, []);

    const moveStage = async (ideaId: number, currentStage: string, direction: 'left' | 'right') => {
        const currentIndex = STAGES.findIndex(s => s.id === currentStage);
        const nextIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;

        if (nextIndex >= 0 && nextIndex < STAGES.length) {
            const nextStage = STAGES[nextIndex].id;
            // @ts-ignore
            const res = await window.api.updateIdea(ideaId, { workflow_stage: nextStage });
            if (res.success) {
                loadAllIdeas();
            }
        }
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Workflow...</div>;

    return (
        <div style={boardWrapperStyle}>
            <div style={boardHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {isSidebarCollapsed && (
                        <button
                            onClick={onToggleSidebar}
                            style={sidebarToggleBtnStyle}
                            title="Show Sidebar (Ctrl+B)"
                        >
                            ☰
                        </button>
                    )}
                    <h2 style={{ margin: 0 }}>Workflow Board</h2>
                </div>
                <button onClick={loadAllIdeas} style={refreshBtnStyle}>Refresh</button>
            </div>

            <div style={boardGridStyle}>
                {STAGES.map(stage => (
                    <div key={stage.id} style={columnStyle}>
                        <div style={columnHeaderStyle}>
                            {stage.label}
                            <span style={countBadgeStyle}>
                                {ideas.filter(i => (i.workflow_stage || 'idea') === stage.id).length}
                            </span>
                        </div>

                        <div style={columnContentStyle}>
                            {ideas
                                .filter(i => (i.workflow_stage || 'idea') === stage.id)
                                .map(idea => (
                                    <div key={idea.id} style={cardStyle} onClick={() => onOpenIdea(idea)}>
                                        <div style={cardTitleStyle}>{idea.title}</div>
                                        <div style={cardActionsStyle}>
                                            <button
                                                disabled={STAGES.findIndex(s => s.id === (idea.workflow_stage || 'idea')) === 0}
                                                onClick={(e) => { e.stopPropagation(); moveStage(idea.id, idea.workflow_stage || 'idea', 'left'); }}
                                                style={moveBtnStyle}
                                                title="Move Left"
                                            >
                                                ←
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onScheduleItem(idea); }}
                                                style={{ ...moveBtnStyle, flex: 2 }}
                                                title="Set Schedule"
                                            >
                                                📅 {idea.scheduled_date ? idea.scheduled_date : "Schedule"}
                                            </button>
                                            <button
                                                disabled={STAGES.findIndex(s => s.id === (idea.workflow_stage || 'idea')) === STAGES.length - 1}
                                                onClick={(e) => { e.stopPropagation(); moveStage(idea.id, idea.workflow_stage || 'idea', 'right'); }}
                                                style={moveBtnStyle}
                                                title="Move Right"
                                            >
                                                →
                                            </button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}

const boardWrapperStyle: React.CSSProperties = {
    display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)"
};

const boardHeaderStyle: React.CSSProperties = {
    padding: "24px 32px", display: "flex", justifyContent: "space-between",
    alignItems: "center", background: "var(--sidebar-bg)", borderBottom: "1px solid var(--border)"
};

const boardGridStyle: React.CSSProperties = {
    display: "flex", gap: "16px", padding: "24px", overflowX: "auto", flex: 1, alignItems: "flex-start"
};

const columnStyle: React.CSSProperties = {
    width: "280px", minWidth: "280px", background: "var(--glass)",
    backdropFilter: "blur(8px)", borderRadius: "12px",
    display: "flex", flexDirection: "column", maxHeight: "100%", border: "1px solid var(--glass-border)",
    transition: "var(--transition)", boxShadow: "inset 0 0 0 1px var(--glass-border)"
};

const columnHeaderStyle: React.CSSProperties = {
    padding: "16px", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "2px solid var(--border)"
};

const countBadgeStyle: React.CSSProperties = {
    background: "var(--bg)", padding: "2px 8px", borderRadius: "10px",
    fontSize: "0.75rem", color: "var(--text-muted)"
};

const columnContentStyle: React.CSSProperties = {
    padding: "12px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto"
};

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg)", padding: "16px", borderRadius: "10px",
    boxShadow: "var(--shadow)", cursor: "pointer",
    border: "1px solid var(--glass-border)", transition: "var(--transition)"
};

const cardTitleStyle: React.CSSProperties = {
    fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)", marginBottom: "4px"
};

/* const cardMetaStyle: React.CSSProperties = {
    fontSize: "0.75rem", color: "var(--text-muted)"
}; */

const cardActionsStyle: React.CSSProperties = {
    marginTop: "12px", display: "flex", gap: "8px"
};

const moveBtnStyle: React.CSSProperties = {
    flex: 1, padding: "4px", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer", color: "var(--text-main)",
    transition: "var(--transition)"
};

const refreshBtnStyle: React.CSSProperties = {
    padding: "8px 16px", background: "var(--primary)", color: "white",
    border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer"
};

const sidebarToggleBtnStyle: React.CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "1.2rem",
    color: "var(--text-main)",
    boxShadow: "var(--shadow)",
    transition: "var(--transition)"
};

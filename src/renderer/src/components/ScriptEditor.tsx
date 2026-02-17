import { useState, useEffect, useRef } from "react";

interface ScriptEditorProps {
    ideaId: number;
    ideaTitle: string;
    onBack: () => void;
    isAssetPanelOpen: boolean;
    onToggleAssetPanel: () => void;
    isSidebarCollapsed: boolean;
    onToggleSidebar: () => void;
}

export function ScriptEditor({ ideaId, ideaTitle, onBack, isAssetPanelOpen, onToggleAssetPanel, isSidebarCollapsed, onToggleSidebar }: ScriptEditorProps) {
    const [content, setContent] = useState("");
    const [notes, setNotes] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [status, setStatus] = useState("Saved");
    const [showNotes, setShowNotes] = useState(false);

    // Refs for manual save trigger
    const contentRef = useRef("");
    const notesRef = useRef("");
    const wordCountRef = useRef(0);

    useEffect(() => {
        contentRef.current = content;
        notesRef.current = notes;
        wordCountRef.current = wordCount;
    }, [content, notes, wordCount]);

    const performSave = async () => {
        setStatus("Saving...");
        try {
            await window.api.saveScript(ideaId, contentRef.current, notesRef.current, wordCountRef.current);
            setStatus("Saved");
        } catch (e) {
            console.error(e);
            setStatus("Error saving");
        }
    };

    const handleExport = async (format: 'txt' | 'md') => {
        setStatus("Exporting...");
        const res = await window.api.exportScript(ideaTitle, content, format);
        if (res.success) {
            setStatus("Exported!");
            setTimeout(() => setStatus("Saved"), 2000);
        } else if (!res.canceled) {
            setStatus("Export Error");
        } else {
            setStatus("Saved");
        }
    };

    // Load script
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!ideaId) return;
            setStatus("Loading...");
            try {
                const result = await window.api.getScript(ideaId);
                if (mounted && result.success) {
                    if (result.data) {
                        setContent(result.data.content || "");
                        setNotes(result.data.notes || "");
                        setWordCount(result.data.word_count || 0);
                    } else {
                        setContent("");
                        setNotes("");
                        setWordCount(0);
                    }
                    setStatus("Saved");
                }
            } catch (e) {
                console.error(e);
                if (mounted) setStatus("Error loading");
            }
        })();
        return () => { mounted = false; };
    }, [ideaId]);

    // Autosave Logic (Debounced)
    useEffect(() => {
        if (!ideaId) return;

        const count = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        setWordCount(count);
        setStatus("Saving...");

        const timer = setTimeout(() => {
            performSave();
        }, 1500); // 1.5s debounce for autosave

        return () => clearTimeout(timer);
    }, [content, notes, ideaId]);

    // Keyboard Shortcuts (Ctrl+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                performSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [ideaId]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "var(--bg)",
            position: "relative",
            flex: 1
        }}>
            {/* Toolbar */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 24px",
                borderBottom: "1px solid var(--border)",
                background: "var(--glass)",
                backdropFilter: "blur(12px)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    {isSidebarCollapsed && (
                        <button
                            onClick={onToggleSidebar}
                            style={{
                                background: "var(--bg)",
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
                                transition: "var(--transition)"
                            }}
                            title="Show Sidebar (Ctrl+B)"
                        >
                            ☰
                        </button>
                    )}
                    <button
                        onClick={onBack}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                        className="back-btn"
                        title="Back to Ideas"
                    >
                        ←
                    </button>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        {wordCount} Words
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                        onClick={onToggleAssetPanel}
                        style={{
                            background: isAssetPanelOpen ? "var(--primary-light)" : "var(--bg)",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: isAssetPanelOpen ? "var(--primary)" : "var(--text-main)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "var(--transition)"
                        }}
                        title={isAssetPanelOpen ? "Hide Assets" : "Show Assets"}
                    >
                        📁 {isAssetPanelOpen ? "Hide Assets" : "Show Assets"}
                    </button>
                    <span style={{
                        fontSize: "0.75rem",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        background: status === "Saved" ? "var(--success-bg)" : "var(--warning-bg)",
                        color: status === "Saved" ? "var(--success-text)" : "var(--warning-text)",
                        border: `1px solid ${status === "Saved" ? "var(--success-text)" : "var(--warning-text)"}44`,
                        fontWeight: 700,
                        transition: "var(--transition)"
                    }}>
                        {status}
                    </span>

                    {/* Export Dropdown (Simple) */}
                    <div className="export-group" style={{ display: "flex", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)", padding: "2px" }}>
                        <button onClick={() => handleExport('txt')} style={exportBtnStyle}>TXT</button>
                        <button onClick={() => handleExport('md')} style={exportBtnStyle}>MD</button>
                    </div>

                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        style={{
                            padding: "6px 12px",
                            fontSize: "0.85rem",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            background: showNotes ? "var(--primary)" : "var(--bg)",
                            color: showNotes ? "white" : "var(--text-main)",
                            fontWeight: 500,
                            transition: "var(--transition)"
                        }}
                    >
                        {showNotes ? "Hide Notes" : "Show Notes"}
                    </button>
                    <button
                        onClick={performSave}
                        style={{
                            padding: "6px 12px",
                            fontSize: "0.85rem",
                            borderRadius: "6px",
                            border: "none",
                            background: "var(--primary)",
                            color: "white",
                            fontWeight: 500
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Editor Area */}
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: "24px",
                    overflowY: "auto"
                }}>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing your script..."
                        style={{
                            flex: 1,
                            width: "100%",
                            maxWidth: "100%",
                            margin: "0",
                            border: "none",
                            outline: "none",
                            fontSize: "1.1rem",
                            lineHeight: "1.7",
                            color: "var(--text-main)",
                            fontFamily: "'Inter', sans-serif",
                            resize: "none",
                            background: "transparent"
                        }}
                    />
                </div>

                {/* Optional Notes Panel */}
                {showNotes && (
                    <div style={{
                        width: "300px",
                        borderLeft: "1px solid var(--border)",
                        display: "flex",
                        flexDirection: "column",
                        background: "var(--sidebar-bg)",
                        animation: "slideIn 0.3s ease-out"
                    }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: "0.9rem" }}>
                            Script Notes
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add research, references, or ideas here..."
                            style={{
                                flex: 1,
                                padding: "16px",
                                border: "none",
                                outline: "none",
                                fontSize: "0.9rem",
                                background: "transparent",
                                resize: "none",
                                color: "var(--text-main)"
                            }}
                        />
                    </div>
                )}
            </div>

            <style>
                {`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                `}
            </style>
        </div>
    );
}

const exportBtnStyle: React.CSSProperties = {
    padding: "4px 8px",
    fontSize: "0.75rem",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 600,
    color: "var(--text-muted)"
};

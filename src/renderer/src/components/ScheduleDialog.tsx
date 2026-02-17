import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, X, Check, Trash } from "lucide-react";

interface ScheduleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onScheduled: () => void;
}

export function ScheduleDialog({ isOpen, onClose, item, onScheduled }: ScheduleDialogProps) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    useEffect(() => {
        if (item) {
            setDate(item.scheduled_date || "");
            setTime(item.scheduled_time || "");
        }
    }, [item, isOpen]);

    if (!item) return null;

    const handleSave = async () => {
        const updates = {
            scheduled_date: date || null,
            scheduled_time: time || null
        };

        let res;
        if (item.type === 'project' || (!item.project_id && item.id)) {
            res = await window.api.updateProject(item.id, updates);
        } else {
            res = await window.api.updateIdea(item.id, updates);
        }

        if (res.success) {
            onScheduled();
            onClose();
        }
    };

    const handleClear = async () => {
        const updates = {
            scheduled_date: null,
            scheduled_time: null
        };

        let res;
        if (item.type === 'project' || (!item.project_id && item.id)) {
            res = await window.api.updateProject(item.id, updates);
        } else {
            res = await window.api.updateIdea(item.id, updates);
        }

        if (res.success) {
            onScheduled();
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={modalOverlayStyle} onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={modalContentStyle}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: "24px" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '10px', color: 'var(--primary)' }}>
                                    <Calendar size={20} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Schedule {item.type === 'project' ? 'Project' : 'Idea'}</h3>
                            </div>
                            <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>Target Item</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title || item.name}</div>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>
                                <Calendar size={14} style={{ marginRight: '6px' }} />
                                Publication Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <label style={labelStyle}>
                                <Clock size={14} style={{ marginRight: '6px' }} />
                                Preferred Time (Optional)
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={handleSave} style={primaryBtnStyle}>
                                <Check size={18} style={{ marginRight: '8px' }} />
                                Save Schedule
                            </button>
                            {(item.scheduled_date || item.scheduled_time) && (
                                <button onClick={handleClear} style={secondaryBtnStyle}>
                                    <Trash size={18} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

const modalOverlayStyle: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 2000, backdropFilter: "blur(4px)"
};

const modalContentStyle: React.CSSProperties = {
    background: "var(--card-bg)", padding: "32px", borderRadius: "24px",
    width: "420px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)",
    position: 'relative'
};

const labelStyle: React.CSSProperties = {
    display: "flex", alignItems: 'center', fontSize: "0.85rem", fontWeight: 700,
    color: "var(--text-muted)", marginBottom: "10px"
};

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px", borderRadius: "12px",
    border: "1px solid var(--border)", fontSize: "1rem",
    boxSizing: "border-box", background: "var(--bg)", color: "var(--text-main)",
    outline: 'none', transition: 'var(--transition)'
};

const closeBtnStyle: React.CSSProperties = {
    background: "none", border: "none", padding: '8px',
    cursor: "pointer", color: "var(--text-muted)", display: 'flex'
};

const primaryBtnStyle: React.CSSProperties = {
    flex: 1, padding: "14px", background: "var(--primary)",
    color: "white", border: "none", borderRadius: "14px",
    fontWeight: 700, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const secondaryBtnStyle: React.CSSProperties = {
    padding: "14px", background: "var(--bg)",
    color: "var(--danger)", border: "1px solid var(--border)", borderRadius: "14px",
    fontWeight: 600, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'
};

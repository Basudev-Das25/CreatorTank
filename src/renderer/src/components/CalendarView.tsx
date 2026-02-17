import { useState, useEffect } from "react";

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
        const res = await window.api.getScheduledIdeas();
        if (res.success) {
            setIdeas(res.data || []);
        }
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

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Calendar Grid
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(null); // Empty slots before first day
    }
    for (let i = 1; i <= totalDays; i++) {
        calendarDays.push(i);
    }

    const getIdeasForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return ideas.filter(i => i.scheduled_date === dateStr);
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Calendar...</div>;

    return (
        <div style={calendarWrapperStyle}>
            {/* Header */}
            <div style={calendarHeaderStyle}>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                    {isSidebarCollapsed && (
                        <button
                            onClick={onToggleSidebar}
                            style={sidebarToggleBtnStyle}
                            title="Show Sidebar (Ctrl+B)"
                        >
                            ☰
                        </button>
                    )}
                    <h2 style={{ margin: 0 }}>{monthName} {year}</h2>
                    <div style={navGroupStyle}>
                        <button onClick={prevMonth} style={navBtnStyle}>←</button>
                        <button onClick={() => setCurrentDate(new Date())} style={navBtnStyle}>Today</button>
                        <button onClick={nextMonth} style={navBtnStyle}>→</button>
                    </div>
                </div>
                <button onClick={loadIdeas} style={refreshBtnStyle}>Refresh</button>
            </div>

            {/* Days Header */}
            <div style={daysGridHeaderStyle}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={dayLabelStyle}>{d}</div>
                ))}
            </div>

            {/* Grid */}
            <div style={calendarGridStyle}>
                {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} style={dayBoxEmptyStyle} />;

                    const dayIdeas = getIdeasForDay(day);
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                    return (
                        <div key={day} style={{ ...dayBoxStyle, background: isToday ? 'rgba(99, 102, 241, 0.1)' : "transparent" }}>
                            <div style={{ ...dayNumberStyle, color: isToday ? "var(--primary)" : "#64748b" }}>
                                {day}
                                {isToday && <span style={todayIndicatorStyle}>Today</span>}
                            </div>
                            <div style={dayEventsStyle}>
                                {dayIdeas.map(item => (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => onOpenIdea(item)}
                                        style={{
                                            ...eventCardStyle,
                                            borderLeft: item.type === 'project' ? "3px solid var(--primary)" : "1px solid var(--border)",
                                            background: item.type === 'project' ? "var(--bg)" : "var(--card-bg)"
                                        }}
                                        title={`${item.title} - ${item.project_name || 'Project'}`}
                                    >
                                        <div style={{ ...eventTitleStyle, fontWeight: item.type === 'project' ? 800 : 600 }}>
                                            {item.type === 'project' ? `📁 ${item.title}` : item.title}
                                        </div>
                                        {item.scheduled_time && (
                                            <div style={eventTimeStyle}>{item.scheduled_time}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const calendarWrapperStyle: React.CSSProperties = {
    display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)"
};

const calendarHeaderStyle: React.CSSProperties = {
    padding: "24px 32px", display: "flex", justifyContent: "space-between",
    alignItems: "center", background: "var(--glass)", backdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--glass-border)"
};

const navGroupStyle: React.CSSProperties = {
    display: "flex", background: "var(--bg)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border)"
};

const navBtnStyle: React.CSSProperties = {
    padding: "6px 16px", background: "transparent", border: "none",
    borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
    color: "var(--text-main)", transition: "var(--transition)"
};

const daysGridHeaderStyle: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
    borderBottom: "1px solid var(--border)", background: "var(--bg)"
};

const dayLabelStyle: React.CSSProperties = {
    padding: "12px", textAlign: "center", fontSize: "0.75rem",
    fontWeight: 700, color: "#94a3b8", textTransform: "uppercase"
};

const calendarGridStyle: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
    gridTemplateRows: "repeat(auto-fill, minmax(120px, 1fr))",
    flex: 1, overflowY: "auto"
};

const dayBoxStyle: React.CSSProperties = {
    borderRight: "1px solid var(--glass-border)", borderBottom: "1px solid var(--glass-border)",
    padding: "8px", minHeight: "120px", display: "flex", flexDirection: "column",
    transition: "var(--transition)"
};

const dayBoxEmptyStyle: React.CSSProperties = {
    ...dayBoxStyle, background: "var(--sidebar-bg)", opacity: 0.5
};

const dayNumberStyle: React.CSSProperties = {
    fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px",
    display: "flex", justifyContent: "space-between", alignItems: "center"
};

const todayIndicatorStyle: React.CSSProperties = {
    fontSize: "0.65rem", background: "var(--primary)", color: "white",
    padding: "2px 6px", borderRadius: "4px"
};

const dayEventsStyle: React.CSSProperties = {
    display: "flex", flexDirection: "column", gap: "4px", flex: 1
};

const eventCardStyle: React.CSSProperties = {
    background: "var(--card-bg)", padding: "6px 10px", borderRadius: "6px",
    border: "1px solid var(--glass-border)", boxShadow: "var(--shadow)",
    cursor: "pointer", fontSize: "0.75rem", transition: "var(--transition)"
};

const eventTitleStyle: React.CSSProperties = {
    fontWeight: 600, color: "var(--text-main)", whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis"
};

const eventTimeStyle: React.CSSProperties = {
    fontSize: "0.65rem", color: "#64748b", marginTop: "2px"
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
    transition: "var(--transition)",
    marginRight: "4px"
};

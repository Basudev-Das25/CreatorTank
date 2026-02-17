import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Database,
    Monitor,
    Keyboard,
    Download,
    Upload,
    Search,
    X,
    FolderOutput,
    Table,
    ChevronRight,
    Sun,
    Moon,
    Laptop
} from 'lucide-react';

interface ToolsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentProject?: any;
    settings: any;
    onSettingsUpdate: () => void;
}

type Tab = 'appearance' | 'shortcuts' | 'data';

export function ToolsPanel({ isOpen, onClose, currentProject, settings, onSettingsUpdate }: ToolsPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('appearance');
    const [status, setStatus] = useState('');

    const handleBackup = async () => {
        setStatus('Creating backup...');
        const res = await window.api.createBackup();
        if (res.success) setStatus(`Backup created!`);
        else if (!res.canceled) setStatus(`Error: ${res.error}`);
    };

    const handleRestore = async () => {
        const res = await window.api.restoreBackup();
        if (!res.success && !res.canceled) setStatus(`Error: ${res.error}`);
    };

    const handleReindex = async () => {
        setStatus('Rebuilding index...');
        const res = await window.api.reindexSearch();
        if (res.success) setStatus('Search index rebuilt!');
        else setStatus(`Error: ${res.error}`);
    };

    const handleExportProject = async (format: 'json' | 'csv') => {
        if (!currentProject) {
            setStatus('Select a project first');
            return;
        }
        setStatus('Exporting...');
        const ideasRes = await window.api.getIdeasByProject(currentProject.id);
        if (ideasRes.success && ideasRes.data) {
            const res = await window.api.exportMetadata(ideasRes.data, format, `export_${currentProject.name.toLowerCase().replace(/\s+/g, '_')}`);
            if (res.success) setStatus(`Exported to ${res.path}`);
            else if (!res.canceled) setStatus(`Error: ${res.error}`);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999, backdropFilter: 'blur(4px)' }}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            width: '440px',
                            bottom: 0,
                            background: 'var(--card-bg)',
                            zIndex: 1000,
                            boxShadow: 'var(--shadow-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            borderLeft: '1px solid var(--border)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '32px 32px 20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '10px' }}>
                                    <Settings size={22} />
                                </div>
                                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem' }}>Settings</h2>
                            </div>
                            <button onClick={onClose} style={{ border: 'none', background: 'var(--bg)', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs Navigation */}
                        <div style={{ padding: '0 32px 24px 32px', display: 'flex', gap: '8px' }}>
                            {[
                                { id: 'appearance', label: 'Theme', icon: <Monitor size={16} /> },
                                { id: 'shortcuts', label: 'Hotkeys', icon: <Keyboard size={16} /> },
                                { id: 'data', label: 'Data', icon: <Database size={16} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '10px',
                                        border: '1px solid transparent',
                                        background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                                        color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px 32px' }}>
                            {activeTab === 'appearance' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={sectionStyle}>
                                        <h4 style={sectionHeaderStyle}>Theme Styling</h4>
                                        <div style={controlRowStyle}>
                                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                                {[
                                                    { id: 'light', label: 'Light', icon: <Sun size={18} /> },
                                                    { id: 'dark', label: 'Dark', icon: <Moon size={18} /> },
                                                    { id: 'system', label: 'System', icon: <Laptop size={18} /> }
                                                ].map(mode => (
                                                    <button
                                                        key={mode.id}
                                                        onClick={() => {
                                                            window.api.updateSetting('theme_mode', mode.id);
                                                            onSettingsUpdate();
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            padding: '20px 12px',
                                                            borderRadius: '14px',
                                                            border: '1px solid var(--border)',
                                                            background: settings.theme_mode === mode.id ? 'var(--primary-light)' : 'var(--bg)',
                                                            color: settings.theme_mode === mode.id ? 'var(--primary)' : 'var(--text-main)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {mode.icon}
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{mode.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={sectionStyle}>
                                        <h4 style={sectionHeaderStyle}>App Information</h4>
                                        <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                            CreatorTank v1.0.0<br />
                                            Local-first Data Engine: SQLite + SQL.js<br />
                                            UI Infrastructure: React + Framer Motion
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'shortcuts' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        { key: 'shortcut_search', label: 'Global Search', desc: 'Find anything instantly' },
                                        { key: 'shortcut_sidebar', label: 'Toggle Sidebar', desc: 'Expand/collapse navigation' },
                                        { key: 'shortcut_schedule', label: 'Schedule Item', desc: 'Open date picker for items' }
                                    ].map(item => (
                                        <div key={item.key} style={{ padding: '16px', background: 'var(--bg)', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.label}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                                            </div>
                                            <input
                                                value={settings[item.key] || ''}
                                                onChange={async (e) => {
                                                    await window.api.updateSetting(item.key, e.target.value);
                                                    onSettingsUpdate();
                                                }}
                                                placeholder="None"
                                                style={{
                                                    width: '100px',
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                    textAlign: 'center',
                                                    fontWeight: 800,
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--primary)',
                                                    fontSize: '0.8rem'
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 8px' }}>
                                        Combinations like <strong>Ctrl+Alt+S</strong> are supported.
                                    </p>
                                </motion.div>
                            )}

                            {activeTab === 'data' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={sectionStyle}>
                                        <h4 style={sectionHeaderStyle}>Backup & Recovery</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <button onClick={handleBackup} style={dataBtnStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <Download size={18} />
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 700 }}>Create Backup</div>
                                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Save all data to a .zip file</div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} />
                                            </button>
                                            <button onClick={handleRestore} style={{ ...dataBtnStyle, color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <Upload size={18} />
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 700 }}>Restore Data</div>
                                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Overwrite with previous backup</div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={sectionStyle}>
                                        <h4 style={sectionHeaderStyle}>Export Metadata</h4>
                                        {currentProject ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleExportProject('json')} style={{ ...dataBtnStyle, flex: 1, justifyContent: 'center' }}>
                                                    <FolderOutput size={16} style={{ marginRight: '8px' }} /> JSON
                                                </button>
                                                <button onClick={() => handleExportProject('csv')} style={{ ...dataBtnStyle, flex: 1, justifyContent: 'center' }}>
                                                    <Table size={16} style={{ marginRight: '8px' }} /> CSV
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                Select a project to export its metadata
                                            </div>
                                        )}
                                    </div>

                                    <div style={sectionStyle}>
                                        <h4 style={sectionHeaderStyle}>Maintenance</h4>
                                        <button onClick={handleReindex} style={{ ...dataBtnStyle, borderStyle: 'dashed' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Search size={18} />
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontWeight: 700 }}>Rebuild Search Index</div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Fix search visibility issues</div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Status Footer */}
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: '16px 32px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                {status}
                            </motion.div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' };
const sectionHeaderStyle: React.CSSProperties = { margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', fontWeight: 800 };
const controlRowStyle: React.CSSProperties = { display: 'flex', gap: '12px', alignItems: 'center' };
const dataBtnStyle: React.CSSProperties = {
    padding: '16px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    color: 'var(--text-main)',
    transition: 'all 0.2s',
    width: '100%'
};

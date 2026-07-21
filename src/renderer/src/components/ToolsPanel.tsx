import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Database, Monitor, Keyboard, Download, Upload,
  Search, X, FolderOutput, Table, Sun, Moon, Laptop,
  Bot,
} from 'lucide-react';
import { Button } from './ui/Button';
import { SectionHeader } from './ui/SectionHeader';
import { GlassPanel } from './ui/GlassPanel';
import { panelSlideIn, overlayFade } from '../lib/animations';
import { AISettings } from './AISettings';

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject?: any;
  settings: any;
  onSettingsUpdate: () => void;
}

type Tab = 'appearance' | 'shortcuts' | 'ai' | 'data';

export function ToolsPanel({ isOpen, onClose, currentProject, settings, onSettingsUpdate }: ToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [status, setStatus] = useState('');

  const handleBackup = async () => {
    setStatus('Creating backup...');
    const res = await (window as any).api.createBackup();
    if (res.success) setStatus('Backup created!');
    else if (!res.canceled) setStatus(`Error: ${res.error}`);
  };

  const handleRestore = async () => {
    const res = await (window as any).api.restoreBackup();
    if (!res.success && !res.canceled) setStatus(`Error: ${res.error}`);
  };

  const handleReindex = async () => {
    setStatus('Rebuilding index...');
    const res = await (window as any).api.reindexSearch();
    if (res.success) setStatus('Search index rebuilt!');
    else setStatus(`Error: ${res.error}`);
  };

  const handleExportProject = async (format: 'json' | 'csv') => {
    if (!currentProject) {
      setStatus('Select a project first');
      return;
    }
    setStatus('Exporting...');
    const ideasRes = await (window as any).api.getIdeasByProject(currentProject.id);
    if (ideasRes.success && ideasRes.data) {
      const res = await (window as any).api.exportMetadata(ideasRes.data, format, `export_${currentProject.name.toLowerCase().replace(/\s+/g, '_')}`);
      if (res.success) setStatus(`Exported to ${res.path}`);
      else if (!res.canceled) setStatus(`Error: ${res.error}`);
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Theme', icon: <Monitor size={16} /> },
    { id: 'shortcuts', label: 'Hotkeys', icon: <Keyboard size={16} /> },
    { id: 'ai', label: 'AI', icon: <Bot size={16} /> },
    { id: 'data', label: 'Data', icon: <Database size={16} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={overlayFade.initial}
            animate={overlayFade.animate}
            exit={overlayFade.exit}
            transition={overlayFade.transition}
            style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg)', zIndex: 999, backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={panelSlideIn.initial}
            animate={panelSlideIn.animate}
            exit={panelSlideIn.exit}
            transition={panelSlideIn.transition}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 'min(440px, 100vw)',
              bottom: 0,
              background: 'var(--card-bg)',
              zIndex: 1000,
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid var(--border)',
            }}
          >
            {/* Header */}
            <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ background: 'var(--primary)', color: 'var(--text-inverse)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <Settings size={18} />
                </div>
                <h2 style={{ margin: 0, fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}>Settings</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={18} />} />
            </div>

            {/* Tabs - Scrollable on small screens */}
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'flex', gap: 'var(--space-1)', minWidth: 'min-content' }}>
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as Tab)}
                    icon={tab.icon}
                    style={{ flexShrink: 0, padding: 'var(--space-2) var(--space-3)' }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Content - Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
              {activeTab === 'appearance' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <GlassPanel padding="var(--space-4)">
                    <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Theme Mode</SectionHeader>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                      {[
                        { id: 'light', label: 'Light', icon: <Sun size={18} /> },
                        { id: 'dark', label: 'Dark', icon: <Moon size={18} /> },
                        { id: 'system', label: 'System', icon: <Laptop size={18} /> },
                      ].map((mode) => (
                        <Button
                          key={mode.id}
                          variant={settings.theme_mode === mode.id ? 'primary' : 'secondary'}
                          onClick={() => {
                            (window as any).api.updateSetting('theme_mode', mode.id);
                            onSettingsUpdate();
                          }}
                          icon={mode.icon}
                          style={{ flexDirection: 'column', padding: 'var(--space-4) var(--space-2)', gap: 'var(--space-2)' }}
                        >
                          {mode.label}
                        </Button>
                      ))}
                    </div>
                  </GlassPanel>
                  <GlassPanel padding="var(--space-4)">
                    <SectionHeader style={{ marginBottom: 'var(--space-2)' }}>App Information</SectionHeader>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
                      CreatorTank v1.0.0<br />
                      SQLite + React + Framer Motion
                    </div>
                  </GlassPanel>
                </motion.div>
              )}

              {activeTab === 'shortcuts' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {[
                    { key: 'shortcut_search', label: 'Global Search', desc: 'Find anything instantly' },
                    { key: 'shortcut_sidebar', label: 'Toggle Sidebar', desc: 'Expand/collapse navigation' },
                    { key: 'shortcut_schedule', label: 'Schedule Item', desc: 'Open date picker for items' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      style={{
                        padding: 'var(--space-3)',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>{item.label}</div>
                        <input
                          value={settings[item.key] || ''}
                          onChange={async (e) => {
                            await (window as any).api.updateSetting(item.key, e.target.value);
                            onSettingsUpdate();
                          }}
                          placeholder="None"
                          style={{
                            width: '90px',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            textAlign: 'center',
                            fontWeight: 'var(--weight-bold)',
                            background: 'var(--card-bg)',
                            color: 'var(--primary)',
                            fontSize: 'var(--text-xs)',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                  ))}
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Combinations like <strong>Ctrl+Alt+S</strong> are supported.
                  </p>
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <AISettings settings={settings} onSettingsUpdate={onSettingsUpdate} />
                </motion.div>
              )}

              {activeTab === 'data' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <GlassPanel padding="var(--space-4)">
                    <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Backup & Recovery</SectionHeader>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <Button variant="secondary" onClick={handleBackup} icon={<Download size={14} />} style={{ width: '100%', justifyContent: 'flex-start', padding: 'var(--space-3)' }}>
                        <div>
                          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Create Backup</div>
                          <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>Save all data to a .zip file</div>
                        </div>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleRestore}
                        icon={<Upload size={14} />}
                        style={{ width: '100%', justifyContent: 'flex-start', padding: 'var(--space-3)', color: 'var(--danger)', borderColor: 'var(--danger-bg)' }}
                      >
                        <div>
                          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Restore Data</div>
                          <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>Overwrite with previous backup</div>
                        </div>
                      </Button>
                    </div>
                  </GlassPanel>

                  <GlassPanel padding="var(--space-4)">
                    <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Export Metadata</SectionHeader>
                    {currentProject ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Button variant="secondary" onClick={() => handleExportProject('json')} icon={<FolderOutput size={14} />} style={{ justifyContent: 'center' }}>
                          JSON
                        </Button>
                        <Button variant="secondary" onClick={() => handleExportProject('csv')} icon={<Table size={14} />} style={{ justifyContent: 'center' }}>
                          CSV
                        </Button>
                      </div>
                    ) : (
                      <div style={{ padding: 'var(--space-3)', background: 'var(--bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Select a project to export
                      </div>
                    )}
                  </GlassPanel>

                  <GlassPanel padding="var(--space-4)">
                    <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Maintenance</SectionHeader>
                    <Button variant="secondary" onClick={handleReindex} icon={<Search size={14} />} style={{ width: '100%', justifyContent: 'flex-start', padding: 'var(--space-3)', borderStyle: 'dashed' }}>
                      <div>
                        <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Rebuild Search Index</div>
                        <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>Fix search visibility issues</div>
                      </div>
                    </Button>
                  </GlassPanel>
                </motion.div>
              )}
            </div>

            {/* Status Footer */}
            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--primary)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    display: 'flex',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  {status}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
